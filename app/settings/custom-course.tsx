import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { toast } from 'sonner-native';

import ColorRadioButton from '@/components/color-radio-button';
import Entry from '@/components/entry';
import LabelEntry from '@/components/label-entry';
import Loading from '@/components/loading';
import PageContainer from '@/components/page-container';
import PickerModal from '@/components/picker-modal';
import RadioButton from '@/components/radio-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';

import { CourseCache, type CustomCourse } from '@/lib/course';
import { ScrollView } from 'react-native-gesture-handler';

const DEFAULT_EMPTY_COURSE = {
  id: -1,
  name: '',
  teacher: '',
  color: '#F39F9D',
  priority: 1,
  storageKey: '',
  lastUpdateTime: '',
  isCustom: true,
  location: '',
  startClass: 1,
  endClass: 11,
  startWeek: 1,
  endWeek: 22,
  weekday: 1,
  single: true,
  double: true,
  adjust: false,
  remark: '',
  type: 2, // 2 为自定义课程
} as CustomCourse;

const WEEKDAYS = [
  { value: 1, label: '星期一' },
  { value: 2, label: '星期二' },
  { value: 3, label: '星期三' },
  { value: 4, label: '星期四' },
  { value: 5, label: '星期五' },
  { value: 6, label: '星期六' },
  { value: 7, label: '星期日' },
];

const WEEK_OPTIONS = [
  { value: 'both', label: '单双周' },
  { value: 'single', label: '单周' },
  { value: 'double', label: '双周' },
];

// 颜色沿用老版本的颜色
const COLOR_OPTIONS = [
  { value: '#F39F9D', color: '#F39F9D' },
  { value: '#9FA5D5', color: '#9FA5D5' },
  { value: '#83B6B1', color: '#83B6B1' },
  { value: '#FDC683', color: '#FDC683' },
  { value: '#EB90B1', color: '#EB90B1' },
  { value: '#92C5F2', color: '#92C5F2' },
  { value: '#A4D1A6', color: '#A4D1A6' },
];

export default function CourseAddPage() {
  const searchParams = useLocalSearchParams();
  const id = (searchParams.key as string) ?? '';

  const [loaded, setLoaded] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [course, setCourse] = useState<CustomCourse>(DEFAULT_EMPTY_COURSE);
  const [isWeekDayPickerVisible, setWeekDayPickerVisible] = useState(false);
  const [isClassPickerVisible, setClassPickerVisible] = useState(false);
  const [isWeekPickerVisible, setWeekPickerVisible] = useState(false);
  const [pickerClassType, setPickerClassType] = useState<'startClass' | 'endClass' | null>(null);
  const [pickerWeekType, setPickerWeekType] = useState<'startWeek' | 'endWeek' | null>(null);

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

  // 保存课程（即添加课程）
  const handleSave = useCallback(async (newCourse: CustomCourse) => {
    if (newCourse.startClass > newCourse.endClass || newCourse.startWeek > newCourse.endWeek) {
      toast.error('开始节/周不能大于结束节/周');
      return;
    }

    if (newCourse.name === '') {
      toast.error('课程名称不能为空');
      return;
    }

    setDisabled(true);
    if (newCourse.id === -1 || !newCourse.storageKey) {
      await CourseCache.addCustomCourse(newCourse);
    } else {
      await CourseCache.updateCustomCourse(newCourse);
    }
    console.log('添加课程：', newCourse);
    setDisabled(false);
    router.replace('/(tabs)');
  }, []);

  return (
    <>
      <Stack.Screen options={{ title: '自定义课程' }} />

      {loaded ? (
        <PageContainer>
          <ScrollView className="px-4 pt-4">
            <View className="my-2">
              <Text className="text-lg">名称</Text>
              <Input
                value={course.name}
                onChangeText={name => setCourse({ ...course, name })}
                placeholder="请填写课程全称"
              />
            </View>

            <View className="my-2">
              <Text className="text-lg">教师</Text>
              <Input
                value={course.teacher}
                onChangeText={teacher => setCourse({ ...course, teacher })}
                placeholder="任课教师名称(非必需)"
              />
            </View>

            <View className="my-2">
              <Text className="text-lg">地点</Text>
              <Input
                value={course.location}
                onChangeText={location => setCourse({ ...course, location })}
                placeholder="教学楼+教室号 或具体地点(非必需)"
              />
            </View>

            <LabelEntry
              leftText="星期"
              rightText={WEEKDAYS.find(w => w.value === course.weekday)?.label || '选择星期'}
              onPress={() => setWeekDayPickerVisible(true)}
            />

            {/* 横向显示选择节数，因为有 3 个控件，LabelEntry(起始节) Text 和 LabelEntry(结束节) */}
            <View className="my-2 flex-row items-center justify-between">
              <View className="flex-row items-center justify-between px-2">
                <View className="mx-2 flex-1 items-end">
                  <Entry
                    text={course.startClass ? `第${course.startClass}节` : '未知'}
                    placeholder="选择开始节"
                    onPress={() => {
                      setPickerClassType('startClass');
                      setClassPickerVisible(true);
                    }}
                  />
                </View>
                <Text className="mx-2 text-lg text-text-secondary">至</Text>
                <View className="mx-2 flex-1">
                  <Entry
                    text={course.endClass ? `第${course.endClass}节` : '未知'}
                    placeholder="选择结束节"
                    onPress={() => {
                      setPickerClassType('endClass');
                      setClassPickerVisible(true);
                    }}
                  />
                </View>
              </View>
            </View>

            {/* 横向显示选择周数，因为有 3 个控件，LabelEntry(起始周) Text 和 LabelEntry(结束周) */}
            <View className="my-2 flex-row items-center justify-between">
              <View className="flex-row items-center justify-between px-2">
                <View className="mx-2 flex-1 items-end">
                  <Entry
                    text={course.startClass ? `第${course.startWeek}周` : '未知'}
                    placeholder="选择开始节"
                    onPress={() => {
                      setPickerWeekType('startWeek');
                      setWeekPickerVisible(true);
                    }}
                  />
                </View>
                <Text className="mx-2 text-lg text-text-secondary">至</Text>
                <View className="mx-2 flex-1">
                  <Entry
                    text={course.endClass ? `第${course.endWeek}周` : '未知'}
                    placeholder="选择结束周"
                    onPress={() => {
                      setPickerWeekType('endWeek');
                      setWeekPickerVisible(true);
                    }}
                  />
                </View>
              </View>
            </View>

            <View className="my-2 flex-row items-center justify-between">
              <Text className="text-lg">规则</Text>
              <RadioButton
                options={WEEK_OPTIONS}
                selectedValue={course.single && course.double ? 'both' : course.single ? 'single' : 'double'}
                onChange={value => {
                  if (value === 'both') {
                    setCourse({ ...course, single: true, double: true });
                  } else if (value === 'single') {
                    setCourse({ ...course, single: true, double: false });
                  } else if (value === 'double') {
                    setCourse({ ...course, single: false, double: true });
                  }
                }}
              />
            </View>

            <View className="my-2 flex-row items-center justify-between">
              <Text className="text-lg">颜色</Text>
              <ColorRadioButton
                options={COLOR_OPTIONS}
                selectedValue={course.color} // 当前选中的颜色值
                onChange={newColor => setCourse({ ...course, color: newColor })} // 更新课程颜色
              />
            </View>

            <View className="my-2">
              <Text className="text-lg">备注</Text>
              <Input
                value={course.remark}
                onChangeText={newRemark => setCourse({ ...course, remark: newRemark })}
                placeholder="对这门课的个人备注(非必需)"
              />
            </View>

            <PickerModal
              visible={isWeekDayPickerVisible}
              title="选择星期"
              data={WEEKDAYS} // 使用 weekdays 数据源
              value={course.weekday} // 当前选中的值
              onClose={() => setWeekDayPickerVisible(false)}
              onConfirm={selectedValue => {
                setCourse({ ...course, weekday: selectedValue });
                setWeekDayPickerVisible(false);
              }}
            />

            <PickerModal
              visible={isClassPickerVisible}
              title={`选择${pickerClassType === 'startClass' ? '开始节' : '结束节'}`}
              data={Array.from({ length: 11 }, (_, i) => ({
                value: i + 1,
                label: `第${i + 1}节`,
              }))}
              value={pickerClassType === 'startClass' ? course.startClass : course.endClass}
              onClose={() => setClassPickerVisible(false)}
              onConfirm={selectedValue => {
                if (pickerClassType === 'startClass') {
                  setCourse({ ...course, startClass: selectedValue });
                } else if (pickerClassType === 'endClass') {
                  setCourse({ ...course, endClass: selectedValue });
                }
                setClassPickerVisible(false);
              }}
            />

            <PickerModal
              visible={isWeekPickerVisible}
              title={`选择${pickerWeekType === 'startWeek' ? '开始周' : '结束周'}`}
              data={Array.from({ length: 22 }, (_, i) => ({
                value: i + 1,
                label: `第${i + 1}周`,
              }))}
              value={pickerWeekType === 'startWeek' ? course.startWeek : course.endWeek}
              onClose={() => setWeekPickerVisible(false)}
              onConfirm={selectedValue => {
                if (pickerWeekType === 'startWeek') {
                  setCourse({ ...course, startWeek: selectedValue });
                } else if (pickerWeekType === 'endWeek') {
                  setCourse({ ...course, endWeek: selectedValue });
                }
                setWeekPickerVisible(false);
              }}
            />

            <Button className="my-2" onPress={() => handleSave(course)} disabled={disabled}>
              <Text>添加课程</Text>
            </Button>

            <View className="mx-4 space-y-4">
              <Text className="my-2 text-lg font-bold text-text-secondary">友情提示</Text>
              <Text className="my-2 text-base text-text-secondary">自定义课程目前只能在本地保存，不会同步到云端</Text>
            </View>
          </ScrollView>
        </PageContainer>
      ) : (
        <Loading />
      )}
    </>
  );
}
