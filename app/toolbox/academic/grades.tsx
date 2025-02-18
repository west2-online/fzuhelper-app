import { Stack } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, RefreshControl, ScrollView, TouchableWithoutFeedback, View } from 'react-native';
import { toast } from 'sonner-native';

import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import WheelPicker from '@/components/wheelPicker';
import Ionicons from '@expo/vector-icons/Ionicons';

import { getApiV1JwchAcademicScores, getApiV1JwchTermList } from '@/api/generate';
import { useSafeResponseSolve } from '@/hooks/useSafeResponseSolve';
import {
  GRADE_COLOR_EXCELLENT,
  GRADE_COLOR_FAIL,
  GRADE_COLOR_GOOD,
  GRADE_COLOR_MEDIUM,
  GRADE_COLOR_PASS,
  GRADE_COLOR_UNKNOWN,
} from '@/lib/constants';

interface CourseGradesData {
  name: string; // 课程名
  teacher: string; // 授课教师
  credit: string; // 学分（有 0 学分的课）
  score: string; // 成绩（没有录入成绩会显示‘成绩尚未录入’，5 级制和两级制度会显示中文）
  gpa: string; // 绩点（注意这个可能是空的）
  term: string; // 学期(e.g. 202402)
  exam_type: string; // 考试类型(e.g. 正常考考试、第次重修)
}

interface SemesterSummary {
  totalCredit: number; // 本学期总修学分
  totalCount: number; // 本学期总课程数
  maxScore: number; // 单科最高分
  minScore: number; // 单科最低分
  GPA: number; // GPA
}

// 学期数据，label 表示显示的名称，value 表示实际值，e.g. label=2024年秋季，value=202401
interface SemesterData {
  label: string;
  value: string;
}

// 处理显示名称，示例：
// 202401 -> 2024年秋季
// 202402 -> 2025年春季
const formatSemesterDisplayText = (semester: string) => {
  // 额外判断一下长度，防止出现异常
  if (semester.length !== 6) {
    return '未知学期 (' + semester + ')';
  }

  const year = parseInt(semester.slice(0, 4), 10);
  const term = semester.slice(4);

  return `${year + (term === '01' ? 0 : 1)}年${term === '01' ? '秋季' : '春季'}`;
};

// 这个函数负责将成绩转换为颜色，需要考虑的实现比较多，独立出函数来设计
const parseScoreToColor = (score: string) => {
  // 没有录入成绩
  if (score === '成绩尚未录入') {
    return GRADE_COLOR_UNKNOWN;
  }

  // 数字成绩
  const numericScore = parseFloat(score);
  if (!isNaN(numericScore)) {
    // 判断分数区间并返回对应颜色
    if (numericScore >= 90) {
      return GRADE_COLOR_EXCELLENT; // 优秀
    } else if (numericScore >= 80) {
      return GRADE_COLOR_GOOD; // 良好
    } else if (numericScore >= 70) {
      return GRADE_COLOR_MEDIUM; // 中等
    } else if (numericScore >= 60) {
      return GRADE_COLOR_PASS; // 及格
    } else {
      return GRADE_COLOR_FAIL; // 不及格
    }
  }

  // 五级制成绩
  if (score === '优秀') {
    return GRADE_COLOR_EXCELLENT; // 优秀
  } else if (score === '良好') {
    return GRADE_COLOR_GOOD; // 良好
  } else if (score === '中等') {
    return GRADE_COLOR_MEDIUM; // 中等
  } else if (score === '及格') {
    return GRADE_COLOR_PASS; // 及格
  } else if (score === '不及格') {
    return GRADE_COLOR_FAIL; // 不及格
  }

  // 两级制
  if (score === '合格') {
    return GRADE_COLOR_EXCELLENT; // 合格
  } else if (score === '不合格') {
    return GRADE_COLOR_FAIL; // 不合格
  }

  // 缺考
  if (score === '缺考') {
    return GRADE_COLOR_UNKNOWN; // 缺考
  }
};

// 这个函数负责计算单个学期的总体数据
const calSingleTermSummary = (data: CourseGradesData[], term: string) => {
  const filteredData = data.filter(item => item.term === term);

  // 计算本学期总课程数
  const totalCount = filteredData.length;
  // 计算本学期总修学分
  const totalCredit = filteredData.reduce((sum, item) => sum + parseFloat(item.credit || '0'), 0);
  // 计算单科最高分
  const maxScore = Math.max(...filteredData.map(item => parseFloat(item.score) || 0));
  // 计算单科最低分
  const minScore = Math.min(...filteredData.map(item => parseFloat(item.score) || 0));
  // 计算平均学分绩(GPA)，单门课程学分绩点乘积之和除以总学分
  const gpa = filteredData.reduce((sum, item) => sum + (parseFloat(item.gpa) || 0) * parseFloat(item.credit), 0);

  return {
    totalCount,
    totalCredit,
    maxScore,
    minScore,
    GPA: filteredData.length > 0 ? gpa / filteredData.length : 0, // 平均绩点
  };
};

// 学期成绩卡片样式
const generateGradeCard = (item: CourseGradesData) => (
  <Card className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
    <View className="mb-1 flex flex-row items-center justify-between">
      {/* 课程名称 */}
      <Text className="break-words text-base font-semibold leading-tight text-gray-800">{item.name}</Text>
      {/* 考试类型 */}
      <Text className="text-sm text-gray-500">{item.exam_type}</Text>
    </View>
    {/* 授课教师 */}
    <Text className="mt-1 truncate text-xs text-gray-600">{item.teacher}</Text>
    {/* 分割线 */}
    <View className="my-1 border-b border-gray-300" />
    <View className="mt-1 flex flex-row items-center justify-between">
      {/* 左侧：应获学分和获得绩点 */}
      <View className="flex w-2/5 flex-row justify-between">
        {/* 应获学分 */}
        <View className="flex flex-col items-start">
          <Text className="text-xs text-gray-500">获得学分</Text>
          <Text className="text-lg font-bold">{item.gpa ? item.credit : '—'}</Text>
        </View>
        {/* 获得绩点 */}
        <View className="flex flex-col items-start">
          <Text className="text-xs text-gray-500">获得绩点</Text>
          <Text className="text-lg font-bold text-blue-500">{item.gpa || '—'}</Text>
        </View>
      </View>
      {/* 右侧：成绩 */}
      <View className="items-right flex w-1/2 flex-col items-end">
        <Text className={`text-3xl font-bold ${parseScoreToColor(item.score)}`}>{item.score}</Text>
      </View>
    </View>
  </Card>
);

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
    console.log('获取学术成绩数据');
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
      <Stack.Screen options={{ title: '学业成绩' }} />

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
          {/* 学期选择 */}
          <View className="mb-4 flex flex-row items-center justify-between space-x-4 rounded-lg bg-gray-100 p-4">
            {/* 左侧部分 */}
            <View className="flex-1">
              <Text className="text-lg font-semibold text-gray-800">
                {currentTerm ? formatSemesterDisplayText(currentTerm) + '(' + currentTerm + ')' : '未选择'}
              </Text>
              <View className="mt-1 flex flex-row items-center">
                <Ionicons name="time-outline" size={16} className="mr-2 text-gray-500" />
                <Text className="text-sm leading-5 text-gray-600">
                  数据同步时间：{(lastUpdated && lastUpdated.toLocaleString()) || '请进行一次同步'}
                </Text>
              </View>
            </View>

            {/* 右侧按钮 */}
            <Button onPress={() => setPickerVisible(true)} className="rounded-lg bg-blue-500 px-4 py-2">
              <Text className="text-sm font-medium text-white">选择学期</Text>
            </Button>
          </View>

          {academicData.length > 0 && semesterSummary && (
            <View>
              <View className="mx-5 flex flex-row items-center justify-between bg-gray-100">
                <View className="flex flex-col items-start">
                  <Text className="text-sm text-gray-500">总课程数</Text>
                  <Text className="text-lg font-bold text-gray-800">{semesterSummary.totalCount}</Text>
                </View>
                <View className="flex flex-col items-start">
                  <Text className="text-sm text-gray-500">应修学分</Text>
                  <Text className="text-lg font-bold text-gray-800">{semesterSummary.totalCredit.toFixed(2)}</Text>
                </View>
                <View className="flex flex-col items-start">
                  <Text className="text-sm text-gray-500">单科最高</Text>
                  <Text className="text-lg font-bold text-gray-800">{semesterSummary.maxScore.toFixed(2)}</Text>
                </View>
                <View className="flex flex-col items-start">
                  <Text className="text-sm text-gray-500">单科最低</Text>
                  <Text className="text-lg font-bold text-gray-800">{semesterSummary.minScore.toFixed(2)}</Text>
                </View>
                <View className="flex flex-col items-start">
                  <Text className="text-sm text-gray-500">平均 GPA</Text>
                  <Text className="text-lg font-bold text-gray-800">{semesterSummary.GPA.toFixed(2) + '(#)'}</Text>
                </View>
              </View>
              <View className="mx-5 flex flex-row items-center justify-between bg-gray-100">
                <Text className="text-sm text-gray-500"># 单一学期GPA 非学校教务系统数据，可能存在误差，仅供参考</Text>
              </View>
            </View>
          )}

          {/* 学术成绩数据列表 */}
          {academicData.filter(item => item.term === currentTerm).length > 0 ? (
            academicData
              .filter(item => item.term === currentTerm)
              .sort((a, b) => {
                // 根据分数排序，高分优先
                const parseScore = (score: string) => {
                  const numericScore = parseFloat(score);
                  if (!isNaN(numericScore)) {
                    return numericScore;
                  }
                  // 五级制和两级制转换为数值进行比较
                  if (score === '优秀') return 89.9;
                  if (score === '良好') return 79.9;
                  if (score === '中等') return 69.9;
                  if (score === '及格' || score === '合格') return 59.9;
                  if (score === '不及格' || score === '不合格') return -1;
                  return -2; // 其他情况，按最低分处理
                };
                return parseScore(b.score) - parseScore(a.score);
              })
              .map((item, index) => (
                <View key={index} className="mx-4 mt-4">
                  {generateGradeCard(item)}
                </View>
              ))
          ) : (
            <Text className="text-center text-gray-500">暂无成绩数据或正在加载中</Text>
          )}
        </ScrollView>
      </ThemedView>

      {/* 底部弹出的 Picker */}
      <Modal
        visible={isPickerVisible}
        transparent
        animationType="slide" // 从底部滑入
        onRequestClose={handleCloseTermSelectPicker} // Android 的返回键关闭
      >
        {/* 点击背景关闭 */}
        <TouchableWithoutFeedback onPress={handleCloseTermSelectPicker}>
          <View className="flex-1 bg-black/50" />
        </TouchableWithoutFeedback>

        {/* Picker 容器 */}
        <View className="space-y-6 rounded-t-2xl bg-background p-6 pb-10">
          <Text className="text-center text-xl font-bold">选择学期</Text>
          <WheelPicker
            data={termList.map(s => s.label + '(' + s.value + ')')}
            wheelWidth="100%"
            selectIndex={tempIndex}
            onChange={idx => setTempIndex(idx)}
          />

          {/* 确认按钮 */}
          <Button className="mt-6" onPress={handleConfirmTermSelectPicker}>
            <Text>确认</Text>
          </Button>
        </View>
      </Modal>
    </>
  );
}
