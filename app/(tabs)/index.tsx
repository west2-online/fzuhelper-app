import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import CoursePage from '@/components/course/course-page';
import Loading from '@/components/loading';

import { getApiV1TermsList } from '@/api/generate';
import type { CourseSetting } from '@/api/interface';
import PageContainer from '@/components/page-container';
import usePersistedQuery from '@/hooks/usePersistedQuery';
import { COURSE_SETTINGS_KEY, COURSE_TERMS_LIST_KEY } from '@/lib/constants';
import { CourseCache, normalizeCourseSetting } from '@/lib/course';
import locateDate from '@/lib/locate-date';
import { NotificationManager } from '@/lib/notification';

export default function HomePage() {
  const [config, setConfig] = useState<CourseSetting | null>(null); // 课程设置
  const [currentWeek, setCurrentWeek] = useState<number | null>(null); // 当前周数，默认第一周
  const [cacheInitialized, setCacheInitialized] = useState(false); // 缓存是否初始化

  // 这个学期数据（不是课程数据，是学期的开始结束时间等信息）存本地就可以了，本地做个长时间的缓存，这玩意一学期变一次，保守一点缓 7 天把
  // 即使是研究生，也是用这个接口获取学期数据。
  const { data: termsData } = usePersistedQuery({
    queryKey: [COURSE_TERMS_LIST_KEY],
    queryFn: () => getApiV1TermsList(),
    cacheTime: 7 * 1000 * 60 * 60 * 24, // 缓存 7 天
  });

  // loadData 负责加载 config（课表配置）和 locateDateResult（定位日期结果）
  const loadConfigAndDateResult = useCallback(async () => {
    // const startTime = Date.now(); // 记录开始时间

    const res = await locateDate();

    // 获取最新的课表设置
    const setting = await AsyncStorage.getItem(COURSE_SETTINGS_KEY);
    const tryParsedSettings = setting ? JSON.parse(setting) : {};
    const selectedSemester = tryParsedSettings.selectedSemester || res.semester;
    const parsedSettings = normalizeCourseSetting({ ...tryParsedSettings, selectedSemester });
    setConfig(parsedSettings);

    // 更新 AsyncStorage，仅在数据变化时写入
    if (JSON.stringify(tryParsedSettings) !== JSON.stringify(parsedSettings)) {
      await AsyncStorage.setItem(COURSE_SETTINGS_KEY, JSON.stringify(parsedSettings));
    }

    // 如果是历史学期（即和 locateDate 给出的学期不符），则默认是第一周，反之则是当前周
    setCurrentWeek(res.semester === parsedSettings.selectedSemester ? res.week : 1);

    console.log('set initial week: ', res.semester === parsedSettings.selectedSemester ? res.week : 1);
    // const endTime = Date.now(); // 记录结束时间
    // const elapsedTime = endTime - startTime; // 计算耗时
    // console.log(`loadData function took ${elapsedTime}ms to complete.`);
  }, []);

  // 当加载的时候会读取 COURSE_SETTINGS，里面有一个字段会存储当前选择的学期（不一定是最新学期）
  useFocusEffect(
    useCallback(() => {
      if (cacheInitialized) {
        loadConfigAndDateResult();
        // 调用到这里已经经过了开屏页，所以可以注册通知了
      }
    }, [loadConfigAndDateResult, cacheInitialized]),
  );

  useEffect(() => {
    // 确保缓存数据在首次加载时被初始化
    if (!cacheInitialized) {
      const initializeCache = async () => {
        await CourseCache.load(); // 加载缓存数据
        await NotificationManager.register(); // 初始化通知
        setCacheInitialized(true); // 设置缓存已初始化
      };
      initializeCache();
    }
  }, [cacheInitialized]);

  // config 是课表的配置，locateDateResult 是当前时间的定位，termsData 是学期列表的数据（不包含课程数据）
  // 在 AsyncStorage 中，我们按照 COURSE_SETTINGS_KEY__{学期 ID} 的格式存储课表设置
  // 具体加载课程的逻辑在 CoursePage 组件中
  return config && currentWeek && termsData ? (
    <PageContainer>
      <CoursePage config={config} initialWeek={currentWeek} semesterList={termsData.data.data.terms} />
    </PageContainer>
  ) : (
    <Loading />
  );
}
