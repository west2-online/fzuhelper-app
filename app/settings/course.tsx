import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { toast } from 'sonner-native';

import { Icon } from '@/components/Icon';
import LabelEntry from '@/components/label-entry';
import LabelSwitch from '@/components/label-switch';
import PageContainer from '@/components/page-container';
import PickerModal from '@/components/picker-modal';
import { Text } from '@/components/ui/text';
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getApiV1JwchCourseList, getApiV1JwchTermList } from '@/api/generate';
import type { CourseSetting } from '@/api/interface';
import { useUpdateEffect } from '@/hooks/use-update-effect';
import { useSafeResponseSolve } from '@/hooks/useSafeResponseSolve';
import { COURSE_DATA_KEY, COURSE_SETTINGS_KEY } from '@/lib/constants';
import { CourseCache, defaultCourseSetting, readCourseSetting } from '@/lib/course';
import { convertSemester, deConvertSemester } from '@/lib/locate-date';
import { LocalUser, USER_TYPE_POSTGRADUATE } from '@/lib/user';
import { pushToWebViewNormal } from '@/lib/webview';

export default function AcademicPage() {
  const [isPickerVisible, setPickerVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [settings, setSettings] = useState<CourseSetting>(defaultCourseSetting);
  const [semesters, setSemesters] = useState<string[]>([]);
  const { handleError } = useSafeResponseSolve();
  const [isLoadingSemester, setLoadingSemester] = useState(false);

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
    // 保证设置同步到小部件
    CourseCache.save();
  }, [settings, saveSettingsToStorage]);

  // 获取用户就读学期数据
  const getTermsData = useCallback(async () => {
    try {
      const result = await getApiV1JwchTermList(); // 数据格式样例： ['202401', '202402']
      setSemesters(result.data.data); // 更新学期数据源
      setSettings(prevSettings => ({
        ...prevSettings,
        selectedSemester: prevSettings.selectedSemester || semesters[0],
      }));
    } catch (error: any) {
      const data = handleError(error) as { code: string; message: string };
      if (data) {
        toast.error(data?.message || '未知错误');
      }
    }
  }, [semesters, handleError]);

  // 强制刷新数据（即不使用本地缓存）
  const forceRefreshCourseData = useCallback(async () => {
    try {
      let queryTerm = settings.selectedSemester;
      // 如果是研究生的话多一层转换
      if (LocalUser.getUser().type === USER_TYPE_POSTGRADUATE) {
        queryTerm = deConvertSemester(queryTerm);
      }
      const data = await getApiV1JwchCourseList({ term: queryTerm, is_refresh: true });
      const cacheToStore = {
        data: data,
        timestamp: Date.now(),
      };

      await AsyncStorage.setItem([COURSE_DATA_KEY, queryTerm].join('__'), JSON.stringify(cacheToStore));
      CourseCache.setCourses(data.data.data);
      CourseCache.save(); // 强制保存一次，忽略 SetCourses 的判断
      toast.success('刷新成功');
    } catch (error: any) {
      const data = handleError(error) as { code: string; message: string };
      console.log(data);
      if (data) {
        toast.error(data.message ? data.message : '未知错误');
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [settings.selectedSemester, handleError]);

  // 选择学期开关
  const handleOpenTermSelectPicker = useCallback(async () => {
    setLoadingSemester(true);
    await getTermsData();
    setPickerVisible(true);
    setLoadingSemester(false);
  }, [getTermsData]);

  // 确认选择学期
  const handleConfirmTermSelectPicker = useCallback((selectedValue: string) => {
    setPickerVisible(false);
    // 对于研究生，我们只在对外的显示（即 Label 内容等）上显示标准研究生学期，比如 2024-2025-1，但内部存储的永远是和本科生等价的 202401 等字样
    setSettings(prevSettings => ({
      ...prevSettings,
      selectedSemester:
        LocalUser.getUser().type === USER_TYPE_POSTGRADUATE ? convertSemester(selectedValue) : selectedValue,
      // selectedValue,
    }));
  }, []);

  // 设置是否显示非本周课程
  const handleShowNonCurrentWeekCourses = useCallback(() => {
    setSettings(prevSettings => ({
      ...prevSettings,
      showNonCurrentWeekCourses: !prevSettings.showNonCurrentWeekCourses,
    }));
  }, []);

  const handleForceRefresh = useCallback(() => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    forceRefreshCourseData();
  }, [isRefreshing, forceRefreshCourseData]);

  // 控制导出到本地日历
  const handleExportToCalendar = useCallback(async () => {
    router.push('/settings/calendar');
  }, []);

  // 控制导入考场到课表
  const handleExportExamToCourseTable = useCallback(() => {
    setSettings(prevSettings => {
      if (prevSettings.exportExamToCourseTable) {
        CourseCache.clearExamData();
      }
      return {
        ...prevSettings,
        exportExamToCourseTable: !prevSettings.exportExamToCourseTable,
      };
    });
  }, []);

  const handleHiddenCoursesWithoutAttendances = useCallback(() => {
    setSettings(prevSettings => {
      return {
        ...prevSettings,
        hiddenCoursesWithoutAttendances: !prevSettings.hiddenCoursesWithoutAttendances,
      };
    });
  }, []);

  return (
    <>
      <Stack.Screen options={{ title: '课程表设置' }} />

      <PageContainer>
        <ScrollView className="flex-1 px-8 pt-8">
          <SafeAreaView edges={['bottom']}>
            {/* 菜单列表 */}
            <Text className="mb-2 text-sm text-text-secondary">课程数据</Text>

            <LabelEntry
              leftText="刷新数据"
              onPress={handleForceRefresh}
              disabled={isRefreshing}
              rightText={isRefreshing ? '加载中...' : ''}
            />

            <LabelEntry
              leftText="切换学期"
              rightText={
                isLoadingSemester
                  ? '加载中...'
                  : LocalUser.getUser().type === USER_TYPE_POSTGRADUATE
                    ? deConvertSemester(settings.selectedSemester)
                    : settings.selectedSemester
              }
              onPress={handleOpenTermSelectPicker}
              disabled={isLoadingSemester}
            />

            <LabelEntry
              leftText="桌面小部件"
              onPress={() => {
                pushToWebViewNormal('https://west2-online.feishu.cn/wiki/SitbwKuLriaL5bk7Wbicxdf7nYb');
              }}
            />

            <LabelEntry leftText="在系统日历中订阅课表" onPress={handleExportToCalendar} />

            <Text className="mb-2 mt-4 text-sm text-text-secondary">开关设置</Text>

            <LabelSwitch
              label="显示非本周课程"
              value={settings.showNonCurrentWeekCourses}
              onValueChange={handleShowNonCurrentWeekCourses}
            />

            <LabelSwitch
              label="隐藏免听课程"
              value={settings.hiddenCoursesWithoutAttendances}
              onValueChange={handleHiddenCoursesWithoutAttendances}
            />

            <LabelSwitch
              label="显示本学期考场"
              value={settings.exportExamToCourseTable}
              onValueChange={handleExportExamToCourseTable}
            />

            <View className="space-y-4">
              <Text className="my-2 text-lg font-bold text-text-secondary">友情提示</Text>
              <Text className="my-2 text-base text-text-secondary">
                显示考场功能只会显示在当前学期范围内，且设置好日期时间的考场。补考时间在下一学期开学左右两周，因此不会显示。
              </Text>
              <Text className="my-2 text-base text-text-secondary">
                考试时间可能非标准上课时间，请在考场详情中查看具体考试时间，或以授课教师通知为准。
              </Text>
            </View>

            <View className="mt-4 flex flex-row items-center justify-center">
              <Icon name="time-outline" size={16} className="mr-2" />
              <Text className="text-sm leading-5 text-text-primary">
                课表同步时间：{CourseCache.getLastCourseUpdateTime()}
              </Text>
            </View>

            {settings.exportExamToCourseTable && (
              <View className="my-4 flex flex-row items-center justify-center">
                <Icon name="time-outline" size={16} className="mr-2" />
                <Text className="text-sm leading-5 text-text-primary">
                  考场同步时间：{CourseCache.getLastExamUpdateTime()}
                </Text>
              </View>
            )}

            <PickerModal
              visible={isPickerVisible}
              title="选择学期"
              data={semesters.map(s => ({
                value: s,
                label: s,
              }))}
              value={
                LocalUser.getUser().type === USER_TYPE_POSTGRADUATE
                  ? deConvertSemester(settings.selectedSemester)
                  : settings.selectedSemester
              }
              onClose={() => setPickerVisible(false)}
              onConfirm={handleConfirmTermSelectPicker}
            />
          </SafeAreaView>
        </ScrollView>
      </PageContainer>
    </>
  );
}
