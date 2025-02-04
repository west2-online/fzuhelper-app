import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

import CoursePage from '@/components/course/course-page';

import { SemesterList } from '@/api/backend';
import { getApiV1TermsList } from '@/api/generate';
import type { CourseSetting, LocateDateResult } from '@/api/interface';
import Loading from '@/components/loading';
import { COURSE_SETTINGS_KEY, EVENT_COURSE_UPDATE } from '@/lib/constants';
import EventRegister from '@/lib/event-bus';
import { normalizeCourseSetting } from '@/utils/course';
import locateDate from '@/utils/locate-date';
import { toast } from 'sonner-native';

export default function HomePage() {
  const [config, setConfig] = useState<CourseSetting | null>(null);
  const [locateDateResult, setLocateDateResult] = useState<LocateDateResult | null>(null);
  const [semesterList, setSemesterList] = useState<SemesterList>([]);

  // 加载数据的函数
  const loadData = async () => {
    const res = await locateDate();
    setLocateDateResult(res);

    const setting = await AsyncStorage.getItem(COURSE_SETTINGS_KEY);
    const parsedSettings = await normalizeCourseSetting(
      setting ? JSON.parse(setting) : { selectedSemester: res.semester },
    );

    console.log('parsedSettings', parsedSettings);
    setConfig(parsedSettings);

    const termsResponse = await getApiV1TermsList();
    setSemesterList(termsResponse.data.data.terms);
  };

  // 当加载的时候会读取 COUSE_SETTINGS，里面有一个字段会存储当前选择的学期（不一定是最新学期）
  useEffect(() => {
    loadData();

    // 监听事件，当课表设置发生变化时重新加载数据
    const listener = EventRegister.addEventListener(EVENT_COURSE_UPDATE, (data: string) => {
      toast.info('课表学期更新为 ' + data);
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

  return config && locateDateResult && semesterList.length ? (
    <CoursePage config={config} locateDateResult={locateDateResult} semesterList={semesterList} />
  ) : (
    <Loading />
  );
}
