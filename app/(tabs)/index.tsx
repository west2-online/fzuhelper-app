import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

import CoursePage from '@/components/course/course-page';

import { SemesterList } from '@/api/backend';
import { getApiV1TermsList } from '@/api/generate';
import type { CourseSetting, LocateDateResult } from '@/api/interface';
import Loading from '@/components/loading';
import { COURSE_SETTINGS_KEY } from '@/lib/constants';
import locateDate from '@/utils/locate-date';
import normalizeCourseSetting from '@/utils/normalize-course-setting';

export default function HomePage() {
  const [config, setConfig] = useState<CourseSetting | null>(null);
  const [locateDateResult, setLocateDateResult] = useState<LocateDateResult | null>(null);
  const [semesterList, setSemesterList] = useState<SemesterList>([]);

  // 当加载的时候会读取 COUSE_SETTINGS，里面有一个字段会存储当前选择的学期（不一定是最新学期）
  useEffect(() => {
    locateDate().then(async res => {
      setLocateDateResult(res);

      const setting = await AsyncStorage.getItem(COURSE_SETTINGS_KEY);
      const parsedSettings = normalizeCourseSetting(setting ? JSON.parse(setting) : { selectedSemester: res.semester });

      console.log('parsedSettings', parsedSettings);
      setConfig(parsedSettings);
    });
    getApiV1TermsList().then(res => {
      setSemesterList(res.data.data.terms);
    });
  }, []);

  return config && locateDateResult && semesterList ? (
    <CoursePage config={config} locateDateResult={locateDateResult} semesterList={semesterList} />
  ) : (
    <Loading />
  );
}
