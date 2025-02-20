import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner-native';

import LabelEntry from '@/components/LabelEntry';
import SwitchWithLabel from '@/components/Switch';
import { ThemedView } from '@/components/ThemedView';
import PickerModel from '@/components/picker-model';
import { Text } from '@/components/ui/text';

import { getApiV1JwchCourseList, getApiV1JwchTermList, getApiV1TermsList } from '@/api/generate';
import type { CourseSetting } from '@/api/interface';
import { useUpdateEffect } from '@/hooks/use-update-effect';
import usePersistedQuery from '@/hooks/usePersistedQuery';
import { useSafeResponseSolve } from '@/hooks/useSafeResponseSolve';
import { COURSE_DATA_KEY, COURSE_SETTINGS_KEY, COURSE_TERMS_LIST_KEY } from '@/lib/constants';
import { defaultCourseSetting, readCourseSetting } from '@/utils/course';

export default function AcademicPage() {
  // 下面这些数据会在页面 Loading 时读取 AsyncStorage，如果没有才使用下列默认值
  const [isPickerVisible, setPickerVisible] = useState(false); // 是否显示 Picker
  const [settings, setSettings] = useState<CourseSetting>(defaultCourseSetting); // 课程设置
  const [semesters, setSemesters] = useState<string[]>([]); // 动态加载的数据
  const { handleError } = useSafeResponseSolve(); // HTTP 请求错误处理
  const [isLoadingSemester, setLoadingSemester] = useState(false); // 是否正在加载学期数据
  const [pickerSemester, setPickerSemester] = useState(settings.selectedSemester); // 临时索引

  // 从 AsyncStorage 的 COURSE_SETTINGS_KEY 中读取，是一个 json 数据
  const readSettingsFromStorage = useCallback(async () => {
    console.log('读取课程设置');
    setSettings(await readCourseSetting());
  }, []);

  // 将当前设置保存至 AsyncStorage，采用 json 形式保存
  const saveSettingsToStorage = useCallback(async (newSettings: CourseSetting) => {
    console.log('保存课程设置, ', newSettings);
    await AsyncStorage.setItem(COURSE_SETTINGS_KEY, JSON.stringify(newSettings));
  }, []);

  // 页面加载时读取设置
  useEffect(() => {
    readSettingsFromStorage();
  }, [readSettingsFromStorage]);

  // 设置变化时保存设置
  useUpdateEffect(() => {
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

  // 获取学期数据
  const getTermsData = useCallback(async () => {
    try {
      const result = await getApiV1JwchTermList(); // 数据格式样例： ['202401', '202402']
      setSemesters(result.data.data); // 更新学期数据源
      setSettings(prevSettings => ({
        ...prevSettings,
        selectedSemester: prevSettings.selectedSemester || semesters[0],
      }));
    } catch (error: any) {
      const data = handleError(error);
      if (data) {
        toast.error(data.msg ? data.msg : '未知错误');
      }
    }
  }, [semesters, handleError]);

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
    setSettings(prevSettings => ({ ...prevSettings, selectedSemester: pickerSemester }));
  }, [pickerSemester]);

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
    // const startDate = semesterList.find(item => item.term === settings.selectedSemester)?.start_date;
    // if (!startDate) {
    //   toast.error('无法获取学期开始时间，无法导出到日历');
    //   return;
    // }

    // await exportCourseToNativeCalendar(courseData.data.data, startDate);
  }, [termListData, courseData]);

  return (
    <>
      <Stack.Screen options={{ title: '课程表设置' }} />

      <ThemedView className="flex-1 bg-white px-8 pt-8">
        {/* 菜单列表 */}
        <Text className="mb-2 text-sm text-foreground">课程数据</Text>

        <LabelEntry leftText="刷新数据" />

        <LabelEntry
          leftText="切换学期"
          rightText={isLoadingSemester ? '加载中...' : settings.selectedSemester}
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

        <PickerModel
          visible={isPickerVisible}
          title="选择学期"
          data={semesters.map(s => ({
            value: s,
            label: s,
          }))}
          value={settings.selectedSemester}
          onClose={handleCloseTermSelectPicker}
          onConfirm={handleConfirmTermSelectPicker}
          onValueChange={setPickerSemester}
        />
      </ThemedView>
    </>
  );
}
