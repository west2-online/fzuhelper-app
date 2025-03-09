import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import Loading from '@/components/loading';
import PageContainer from '@/components/page-container';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { CourseCache, type CustomCourse } from '@/lib/course';

const DEFAULT_EMPTY_COURSE = {
  id: -1,
  name: '新课程',
  teacher: '',
  color: '#FF6347',
  priority: 1,
  storageKey: '',
  lastUpdateTime: '',
  isCustom: true,
  location: '',
  startClass: 9,
  endClass: 10,
  startWeek: 1,
  endWeek: 19,
  weekday: 1,
  single: true,
  double: true,
  adjust: false,
  remark: '',
  type: 2,
} as CustomCourse;

export default function CourseAddPage() {
  const searchParams = useLocalSearchParams();
  const id = (searchParams.id as string) ?? '';

  const [loaded, setLoaded] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [course, setCourse] = useState<CustomCourse>(DEFAULT_EMPTY_COURSE);

  useEffect(() => {
    setLoaded(false);
    if (id) {
      CourseCache.load().then(async () => {
        setCourse((await CourseCache.getCustomCourse(id)) || DEFAULT_EMPTY_COURSE);
        setLoaded(true);
      });
    } else {
      setCourse(DEFAULT_EMPTY_COURSE);
      setLoaded(true);
    }
  }, [id]);

  const handleSave = useCallback(async (course: CustomCourse) => {
    setDisabled(true);
    if (course.id === -1 || !course.storageKey) {
      await CourseCache.addCustomCourse(course);
    } else {
      await CourseCache.updateCustomCourse(course);
    }
    console.log('added');
    setDisabled(false);
    router.replace('/(tabs)');
  }, []);

  return (
    <>
      <Stack.Screen options={{ title: '自定义课程' }} />

      {loaded ? (
        <PageContainer>
          <View>
            <Text>名称</Text>
            <Input value={course.name} onChangeText={name => setCourse({ ...course, name })} />
          </View>

          <View>
            <Text>教师</Text>
            <Input value={course.teacher} onChangeText={teacher => setCourse({ ...course, teacher })} />
          </View>

          <View>
            <Text>地点</Text>
            <Input value={course.location} onChangeText={location => setCourse({ ...course, location })} />
          </View>

          <Button onPress={() => handleSave(course)} disabled={disabled}>
            <Text>保存</Text>
          </Button>
        </PageContainer>
      ) : (
        <Loading />
      )}
    </>
  );
}
