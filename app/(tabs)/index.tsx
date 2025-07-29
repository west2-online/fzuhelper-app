import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { createContext, useCallback, useEffect, useState } from 'react';

import CoursePage from '@/components/course/course-page';
import Loading from '@/components/loading';

import { TermsListResponse_Term } from '@/api/backend';
import { getApiV1TermsList } from '@/api/generate';
import type { CourseSetting } from '@/api/interface';
import PageContainer from '@/components/page-container';
import { COURSE_SETTINGS_KEY, COURSE_TERMS_LIST_KEY, EXPIRE_ONE_DAY } from '@/lib/constants';
import { CourseCache, normalizeCourseSetting } from '@/lib/course';
import locateDate, { getWeeksBySemester } from '@/lib/locate-date';
import { NotificationManager } from '@/lib/notification';
import { fetchWithCache } from '@/utils/fetch-with-cache';
import { toast } from 'sonner-native';

interface CoursePageContextProps {
  setting: CourseSetting; // 课程表设置
  currentWeek: number; // 今天在选中学期的周数，如果今天不在选中学期内则为-1
  currentTerm: TermsListResponse_Term; // 当前选中学期基本信息
  maxWeek: number; // 当前选中学期的最大周数
}

// 此处这样写仅为了通过类型检查，实际使用时不可能为空
export const CoursePageContext = createContext<CoursePageContextProps>({} as CoursePageContextProps);

export default function HomePage() {
  const [coursePageContextProps, setCoursePageContextProps] = useState<CoursePageContextProps | null>(null);

  const [cacheInitialized, setCacheInitialized] = useState(false); // 缓存是否初始化

  // loadData 负责加载 config（课表配置）和 locateDateResult（定位日期结果）
  const loadConfigAndDateResult = useCallback(async () => {
    // const startTime = Date.now(); // 记录开始时间

    // 这个学期数据（不是课程数据，是学期的开始结束时间等信息）存本地就可以了，本地做个长时间的缓存，这玩意一学期变一次，保守一点缓 7 天把
    // 即使是研究生，也是用这个接口获取学期数据。
    const termsData = await fetchWithCache(
      [COURSE_TERMS_LIST_KEY],
      () => getApiV1TermsList(),
      7 * EXPIRE_ONE_DAY, // 缓存 7 天
    );

    const locateDateRes = await locateDate();

    // 获取最新的课表设置
    const setting = await AsyncStorage.getItem(COURSE_SETTINGS_KEY);
    const tryParsedSettings = setting ? JSON.parse(setting) : {};
    const selectedSemester = tryParsedSettings.selectedSemester || locateDateRes.semester;
    const parsedSettings = normalizeCourseSetting({ ...tryParsedSettings, selectedSemester });

    // 定位当前周，如果是历史学期（即和 locateDate 给出的学期不符），则为-1
    const currentWeek = locateDateRes.semester === parsedSettings.selectedSemester ? locateDateRes.week : -1;

    // 获取当前学期信息
    const currentTerm = termsData?.data.data.terms.find(t => t.term === selectedSemester);

    if (!termsData || !currentTerm) {
      console.error('Failed to load term data: ', termsData, currentTerm);
      toast.error('获取学期信息失败，请稍后再试');
      return;
    }

    // 获取当前学期的最大周数
    const maxWeek = getWeeksBySemester(currentTerm.start_date, currentTerm.end_date);

    setCoursePageContextProps({
      setting: parsedSettings,
      currentWeek,
      currentTerm,
      maxWeek,
    });

    // 更新 AsyncStorage，仅在数据变化时写入
    if (JSON.stringify(tryParsedSettings) !== JSON.stringify(parsedSettings)) {
      await AsyncStorage.setItem(COURSE_SETTINGS_KEY, JSON.stringify(parsedSettings));
    }
    // const endTime = Date.now(); // 记录结束时间
    // const elapsedTime = endTime - startTime; // 计算耗时
    // console.log(`loadData function took ${elapsedTime}ms to complete.`);
  }, []);

  // 当加载的时候会读取 COURSE_SETTINGS，里面有一个字段会存储当前选择的学期（不一定是最新学期）
  useFocusEffect(
    useCallback(() => {
      if (cacheInitialized) {
        loadConfigAndDateResult();
      }
    }, [cacheInitialized, loadConfigAndDateResult]),
  );

  useEffect(() => {
    // 确保缓存数据在首次加载时被初始化
    if (!cacheInitialized) {
      const initializeCache = async () => {
        await CourseCache.load(); // 加载缓存数据
        // 将 NotificationManager.register 放到后台运行
        setTimeout(async () => {
          try {
            await NotificationManager.register(); // 初始化通知
            console.log('NotificationManager registered end.');
          } catch (error) {
            console.error('Failed to register NotificationManager:', error);
          }
        }, 2000); // 延迟注册
        setCacheInitialized(true); // 设置缓存已初始化
      };
      initializeCache();
    }
  }, [cacheInitialized]);

  // 在 AsyncStorage 中，我们按照 COURSE_SETTINGS_KEY__{学期 ID} 的格式存储课表设置
  // 具体加载课程的逻辑在 CoursePage 组件中
  return coursePageContextProps ? (
    <PageContainer refreshBackground>
      <CoursePageContext value={coursePageContextProps}>
        <CoursePage />
      </CoursePageContext>
    </PageContainer>
  ) : (
    <Loading />
  );
}
