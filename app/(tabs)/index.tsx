import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

import CoursePage from '@/components/course/course-page';

import { getApiV1TermsList } from '@/api/generate';
import type { CourseSetting, LocateDateResult } from '@/api/interface';
import Loading from '@/components/loading';
import usePersistedQuery from '@/hooks/usePersistedQuery';
import { COURSE_SETTINGS_KEY, COURSE_TERMS_LIST_KEY, EVENT_COURSE_UPDATE } from '@/lib/constants';
import EventRegister from '@/lib/event-bus';
import { normalizeCourseSetting } from '@/utils/course';
import locateDate from '@/utils/locate-date';

export default function HomePage() {
  const [config, setConfig] = useState<CourseSetting | null>(null); // 课程设置
  const [locateDateResult, setLocateDateResult] = useState<LocateDateResult | null>(null); // 日期结果

  // 这个学期数据（不是课程数据，是学期的开始结束时间等信息）存本地就可以了，本地做个长时间的缓存，这玩意一学期变一次，保守一点缓 7 天把
  // 使用含 hooks 的自动缓存逻辑
  const { data: termsData } = usePersistedQuery({
    queryKey: [COURSE_TERMS_LIST_KEY],
    queryFn: () => getApiV1TermsList(),
    cacheTime: 7 * 1000 * 60 * 60 * 24, // 缓存 7 天
  });

  // 加载数据的函数
  const loadData = async () => {
    const res = await locateDate();
    setLocateDateResult(res);

    const setting = await AsyncStorage.getItem(COURSE_SETTINGS_KEY);
    const parsedSettings = await normalizeCourseSetting(
      setting ? JSON.parse(setting) : { selectedSemester: res.semester },
    );

    setConfig(parsedSettings);
  };

  // 当加载的时候会读取 COUSE_SETTINGS，里面有一个字段会存储当前选择的学期（不一定是最新学期）
  useEffect(() => {
    loadData();

    // 监听事件，当课表设置发生变化时重新加载数据
    const listener = EventRegister.addEventListener(EVENT_COURSE_UPDATE, (data: string) => {
      // 先清掉 config，这样直接进 Loading 组件
      setConfig(null);
      loadData();
    });

    // 组件卸载时移除监听器
    return () => {
      if (typeof listener === 'string') {
        EventRegister.removeEventListener(listener);
      }
    };
  }, []);

  // config 是课表的配置，locateDateResult 是当前时间的定位，semesterList 是学期列表的数据（不包含课程数据）
  // 在 AsyncStorage 中，我们按照 COURSE_SETTINGS_KEY__{学期 ID} 的格式存储课表设置
  // 具体加载课程的逻辑在 CoursePage 组件中
  return config && locateDateResult && termsData ? (
    <CoursePage config={config} locateDateResult={locateDateResult} semesterList={termsData.data.data.terms} />
  ) : (
    <Loading />
  );
}
