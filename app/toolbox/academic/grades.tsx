import { Stack } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { toast } from 'sonner-native';

import BottomPicker from '@/components/BottomPicker';
import { ThemedView } from '@/components/ThemedView';
import GradeCard from '@/components/grade/GradeCard';
import SemesterSummaryCard from '@/components/grade/SemesterSummaryCard';
import { Text } from '@/components/ui/text';

import { getApiV1JwchAcademicScores, getApiV1JwchTermList } from '@/api/generate';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSafeResponseSolve } from '@/hooks/useSafeResponseSolve';
import { calSingleTermSummary, parseScore } from '@/lib/grades';
import { formatSemesterDisplayText } from '@/lib/semester';
import { CourseGradesData, SemesterSummary } from '@/types/grades';
import { SemesterData } from '@/types/semester';

export default function GradesPage() {
  const [isRefreshing, setIsRefreshing] = useState(false); // 按钮是否禁用
  const [termList, setTermList] = useState<SemesterData[]>([]); // 学期列表
  const [currentTerm, setCurrentTerm] = useState<string>(''); // 当前学期
  const [semesterSummary, setSemesterSummary] = useState<SemesterSummary | null>(null); // 当前学期总体数据
  const [academicData, setAcademicData] = useState<CourseGradesData[]>([]); // 学术成绩数据
  const [tempIndex, setTempIndex] = useState(0); // 临时索引，指向 Picker 选择的项
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null); // 最后更新时间
  const [isPickerVisible, setPickerVisible] = useState(false); // 是否显示 Picker

  const handleErrorRef = useRef(useSafeResponseSolve().handleError);

  // 访问 west2-online 服务器获取成绩数据（由于教务处限制，只能获取全部数据）
  // 由于教务处限制，成绩数据会直接返回所有课程的成绩，我们需要在本地进行区分，因此引入了下一个获取学期列表的函数
  const getAcademicData = useCallback(async () => {
    try {
      const result = await getApiV1JwchAcademicScores();
      setAcademicData(result.data.data);
      setLastUpdated(new Date()); // 更新最后更新时间
    } catch (error: any) {
      console.log(error);
      const data = handleErrorRef.current(error);
      if (data) {
        toast.error(data.message || '发生未知错误，请稍后再试');
      }
    } finally {
      setIsRefreshing(false); // 确保结束刷新
    }
  }, []);

  // 获取学期列表（当前用户），此处不使用 usePersistedQuery
  // 这和课表的 getApiV1TermsList 不一致，前者（即 getApiV1JwchTermList）只返回用户就读的学期列表
  const fetchTermList = useCallback(async () => {
    try {
      const result = await getApiV1JwchTermList();
      const terms = result.data.data as string[];
      const formattedTerms = terms.map(semester => ({
        label: formatSemesterDisplayText(semester),
        value: semester,
      }));
      setTermList(formattedTerms);
      if (!currentTerm && terms.length) {
        setCurrentTerm(terms[0]);
      }
    } catch (error: any) {
      const data = handleErrorRef.current(error);
      if (data) {
        toast.error(data.message || '发生未知错误，请稍后再试');
      }
    }
  }, [currentTerm]);

  // 直接加载学期列表和学术成绩数据，因为教务处是直接把所有学期的课程数据直接返回，我们所做的只是本地区分
  useEffect(() => {
    fetchTermList();
    getAcademicData();
  }, [fetchTermList, getAcademicData]);

  // 当学期变化时，重新计算学期总体数据
  useEffect(() => {
    if (currentTerm) {
      const filteredData = academicData.filter(item => item.term === currentTerm);
      const summary = calSingleTermSummary(filteredData, currentTerm);
      setSemesterSummary(summary);
    }
  }, [currentTerm, academicData]);

  // 确认选择学期，之后会从 data 中加载该学期的数据
  const handleConfirmTermSelectPicker = useCallback(() => {
    setPickerVisible(false);
    setCurrentTerm(termList[tempIndex]?.value ?? '');
  }, [tempIndex, termList]);

  // 关闭 Picker
  const handleCloseTermSelectPicker = useCallback(() => {
    setPickerVisible(false);
  }, []);

  // 处理下拉刷新逻辑
  const handleRefresh = useCallback(() => {
    if (!isRefreshing) {
      setIsRefreshing(true); // 确保不会重复触发刷新
      setAcademicData([]); // 清空数据
      getAcademicData();
    }
  }, [setAcademicData, getAcademicData, isRefreshing]);

  return (
    <>
      <Stack.Screen options={{ title: '成绩查询' }} />

      <ThemedView className="flex-1">
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                if (!isRefreshing) {
                  handleRefresh();
                }
              }}
            />
          }
        >
          <Tabs value={currentTerm} onValueChange={setCurrentTerm}>
            {/* 可横向滚动的表头 */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TabsList className="flex-row">
                {/* 生成学期表头 */}
                {termList.map((term, index) => (
                  <TabsTrigger key={index} value={term.value} className="items-center">
                    <Text className="w-24 text-center">{term.value}</Text>
                  </TabsTrigger>
                ))}
              </TabsList>
            </ScrollView>

            <TabsContent value={currentTerm}>
              {/* 学期总体数据 */}
              {academicData.length > 0 && semesterSummary && <SemesterSummaryCard summary={semesterSummary} />}

              {/* 学术成绩数据列表 */}
              {academicData.filter(item => item.term === currentTerm).length > 0 ? (
                academicData
                  .filter(item => item.term === currentTerm)
                  .sort((a, b) => {
                    return parseScore(b.score) - parseScore(a.score);
                  })
                  .map((item, index) => (
                    <View key={index} className="mx-4 mt-4">
                      <GradeCard item={item} />
                    </View>
                  ))
              ) : (
                <Text className="text-center text-gray-500">暂无成绩数据或正在加载中</Text>
              )}
            </TabsContent>
          </Tabs>
        </ScrollView>
      </ThemedView>

      {/* 选择学期 */}
      <BottomPicker
        visible={isPickerVisible}
        title="选择学期"
        data={termList.map(s => s.label + '(' + s.value + ')')}
        selectIndex={tempIndex}
        onChange={idx => setTempIndex(idx)}
        onConfirm={handleConfirmTermSelectPicker}
        onClose={handleCloseTermSelectPicker}
      />
    </>
  );
}
