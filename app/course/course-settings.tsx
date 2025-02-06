import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, TouchableWithoutFeedback, View } from 'react-native';
import { toast } from 'sonner-native';

import LabelEntry from '@/components/LabelEntry';
import SwitchWithLabel from '@/components/Switch';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import WheelPicker from '@/components/wheelPicker';

import type { SemesterList } from '@/api/backend';
import { getApiV1JwchCourseList, getApiV1JwchTermList, getApiV1TermsList } from '@/api/generate';
import type { CourseSetting } from '@/api/interface';
import usePersistedQuery from '@/hooks/usePersistedQuery';
import { useSafeResponseSolve } from '@/hooks/useSafeResponseSolve';
import { exportCourseToNativeCalendar } from '@/lib/calendar';
import { COURSE_DATA_KEY, COURSE_SETTINGS_KEY, COURSE_TERMS_LIST_KEY, EVENT_COURSE_UPDATE } from '@/lib/constants';
import EventRegister from '@/lib/event-bus';
import { defaultCourseSetting, readCourseSetting } from '@/utils/course';

interface SemesterData {
  label: string;
  value: string;
}

export default function AcademicPage() {
  // 下面这些数据会在页面 Loading 时读取 AsyncStorage，如果没有才使用下列默认值
  const [isPickerVisible, setPickerVisible] = useState(false); // 是否显示 Picker
  const [settings, setSettings] = useState<CourseSetting>(defaultCourseSetting); // 课程设置
  const [semesters, setSemesters] = useState<SemesterData[]>([]); // 动态加载的数据
  const { handleError } = useSafeResponseSolve(); // HTTP 请求错误处理
  const [isLoadingSemester, setLoadingSemester] = useState(false); // 是否正在加载学期数据
  const [tempIndex, setTempIndex] = useState(0); // 临时索引

  // 处理显示名称，示例：
  // 202401 -> 2024年秋季
  // 202402 -> 2025年春季
  const formatSemesterDisplayText = useCallback((semester: string) => {
    // 额外判断一下长度，防止出现异常
    if (semester.length !== 6) {
      return '未知学期 (' + semester + ')';
    }

    const year = parseInt(semester.slice(0, 4), 10);
    const term = semester.slice(4);

    return `${year + (term === '01' ? 0 : 1)}年${term === '01' ? '秋季' : '春季'}`;
  }, []);

  const semesterLabel = useMemo(
    () => formatSemesterDisplayText(settings.selectedSemester),
    [settings, formatSemesterDisplayText],
  );

  // 从 AsyncStorage 的 COURSE_SETTINGS_KEY 中读取，是一个 json 数据
  const readSettingsFromStorage = useCallback(async () => {
    console.log('读取课程设置');

    setSettings(await readCourseSetting());
  }, []);

  // 将当前设置保存至 AsyncStorage，采用 json 形式保存
  // 保存后会发送 EVENT_COURSE_UPDATE 事件，通知课程页面更新
  const saveSettingsToStorage = useCallback(async (newSettings: CourseSetting) => {
    console.log('保存课程设置');
    await AsyncStorage.setItem(COURSE_SETTINGS_KEY, JSON.stringify(newSettings));
    EventRegister.emit(EVENT_COURSE_UPDATE, newSettings.selectedSemester); // 发送事件，通知课程页面更新为具体的学期
  }, []);

  // 页面加载时读取设置
  useEffect(() => {
    readSettingsFromStorage();
  }, [readSettingsFromStorage]);

  // 设置变化时保存设置
  useEffect(() => {
    saveSettingsToStorage(settings);
  }, [settings, saveSettingsToStorage]);

  const { data: courseData } = usePersistedQuery({
    queryKey: [COURSE_DATA_KEY, settings.selectedSemester],
    queryFn: () => getApiV1JwchCourseList({ term: settings.selectedSemester }),
  });

  const { data: termListData } = usePersistedQuery({
    queryKey: [COURSE_TERMS_LIST_KEY],
    queryFn: getApiV1TermsList,
  });

  const semesterList = useMemo<SemesterList>(() => termListData?.data.data.terms ?? [], [termListData]);

  // 获取学期数据
  const getTermsData = useCallback(async () => {
    try {
      const result = await getApiV1JwchTermList(); // 数据格式样例： ['202401', '202402']
      const formattedSemesters = result.data.data.map(term => ({
        label: formatSemesterDisplayText(term),
        value: term,
      }));
      setSemesters(formattedSemesters); // 更新学期数据源
      setSettings(prevSettings => ({
        ...prevSettings,
        selectedSemester: prevSettings.selectedSemester || formattedSemesters[0]?.value,
      }));
    } catch (error: any) {
      const data = handleError(error);
      if (data) {
        toast.error(data.msg ? data.msg : '未知错误');
      }
    }
  }, [handleError, formatSemesterDisplayText]);

  // 选择学期开关
  const handleOpenTermSelectPicker = useCallback(async () => {
    setLoadingSemester(true);
    await getTermsData();
    setPickerVisible(true);
    setLoadingSemester(false);
  }, [getTermsData]);

  // 关闭 Picker
  const handleCloseTermSelectPicker = useCallback(() => {
    setPickerVisible(false);
  }, []);

  // 确认选择学期（这里默认学期发生改变，即使用户选择了同一个学期）
  const handleConfirmTermSelectPicker = useCallback(() => {
    setPickerVisible(false);
    const newValue = semesters[tempIndex]?.value ?? '';
    setSettings(prevSettings => ({ ...prevSettings, selectedSemester: newValue }));
  }, [tempIndex, semesters]);

  // 设置是否显示非本周课程
  const handleShowNonCurrentWeekCourses = useCallback(() => {
    setSettings(prevSettings => ({
      ...prevSettings,
      showNonCurrentWeekCourses: !prevSettings.showNonCurrentWeekCourses,
    }));
  }, []);

  // 控制导出到本地日历
  const handleExportToCalendar = useCallback(async () => {
    setSettings(prevSettings => ({
      ...prevSettings,
      calendarExportEnabled: !prevSettings.calendarExportEnabled,
    }));

    if (!courseData) {
      toast.error('课程数据为空，无法导出到日历'); // 这个理论上不可能触发
      return;
    }
    if (!termListData) {
      toast.error('学期数据为空，无法导出到日历'); // 这个理论上也不可能触发
      return;
    }
    const startDate = semesterList.find(item => item.term === settings.selectedSemester)?.start_date;
    if (!startDate) {
      toast.error('无法获取学期开始时间，无法导出到日历');
      return;
    }

    await exportCourseToNativeCalendar(courseData.data.data, startDate);
  }, [courseData, settings, termListData, semesterList]);

  useEffect(() => {
    if (isPickerVisible && semesters.length > 0) {
      const sIndex = semesters.findIndex(item => item.value === settings.selectedSemester);
      setTempIndex(sIndex < 0 ? 0 : sIndex);
    }
  }, [isPickerVisible, semesters, settings]);

  return (
    <>
      <Stack.Screen options={{ title: '课程表设置' }} />

      <ThemedView className="flex-1 bg-white px-8 pt-8">
        {/* 菜单列表 */}
        <Text className="mb-2 text-sm text-foreground">课程数据</Text>

        <LabelEntry leftText="刷新数据" />

        <LabelEntry
          leftText="切换学期"
          rightText={isLoadingSemester ? '加载中...' : semesterLabel}
          onPress={handleOpenTermSelectPicker}
          disabled={isLoadingSemester}
        />

        <Text className="mb-2 mt-4 text-sm text-foreground">开关设置</Text>

        <SwitchWithLabel
          label="导出到本地日历"
          value={settings.calendarExportEnabled}
          onValueChange={handleExportToCalendar}
        />

        <SwitchWithLabel
          label="显示非本周课程"
          value={settings.showNonCurrentWeekCourses}
          onValueChange={handleShowNonCurrentWeekCourses}
        />

        <SwitchWithLabel
          label="自动导入调课信息"
          value={settings.autoImportAdjustmentEnabled}
          onValueChange={() =>
            setSettings(prevSettings => ({
              ...prevSettings,
              autoImportAdjustmentEnabled: !prevSettings.autoImportAdjustmentEnabled,
            }))
          }
        />

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
              data={semesters.map(s => s.label + '(' + s.value + ')')}
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
      </ThemedView>
    </>
  );
}
