import { Tabs } from 'expo-router';
import { useState } from 'react';
import { Dimensions, View } from 'react-native';
import { FlatList, TextInput } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

import PageContainer from '@/components/page-container';
import RadioGroup from '@/components/radio-group';
import { TabFlatList } from '@/components/tab-flatlist';

interface CourseCardProps {
  course_name: string;
  teacher_name: string;
  setComment: (comment: string) => void;
  setScore: (score: number) => void;
}

const Divider: React.FC = () => <View className="my-3 h-[2px] bg-secondary" />;

const DEFAULT_COMMENTS = [
  '学识渊博，品德高尚，思学生所思，为学生而为，是传道授业解惑之良师。',
  '爱岗敬业、严谨治学、为人师表。',
  '课堂结构完整，层次清楚，突出重点，突破难点，各环衔接紧密，时间安排合理。',
];
const options = [
  { label: DEFAULT_COMMENTS[0], value: DEFAULT_COMMENTS[0] },
  { label: DEFAULT_COMMENTS[1], value: DEFAULT_COMMENTS[1] },
  { label: DEFAULT_COMMENTS[2], value: DEFAULT_COMMENTS[2] },
  { label: '自己评价', value: 'other' },
];

function CourseCard({ course_name, teacher_name }: CourseCardProps) {
  const [selected, setSelected] = useState<string>('');
  const [customText, setCustomText] = useState('');

  return (
    <View className="m-4 space-y-2 rounded-xl border border-border bg-white p-5">
      <View className="flex-row items-center justify-between">
        <View className="">
          <Text className="font-bold text-text-primary">{course_name}</Text>
          <Text className="break-all text-text-secondary">{teacher_name}</Text>
        </View>
        <TextInput
          keyboardType="number-pad"
          placeholder="输入评分"
          placeholderTextColor="#60a5fa"
          className="rounded-xl bg-text-primary/10 px-4 py-2 text-center text-lg text-text-primary"
        />
      </View>
      <Divider />
      <Text className="mb-1 font-bold">选择评语</Text>
      <RadioGroup
        options={options}
        selected={selected}
        onChange={setSelected}
        customText={customText}
        onCustomTextChange={setCustomText}
      />
    </View>
  );
}

enum Tab {
  学期选课 = '学期选课',
  查成绩 = '查成绩',
}

interface TabContentProps {
  tabname: Tab;
}

function TabContent({ tabname }: TabContentProps) {
  const screenWidth = Dimensions.get('window').width; // 获取屏幕宽度
  const sampleData: CourseCardProps[] = [
    {
      course_name: '面向对象程序设计',
      teacher_name: '吴小竹',
      setComment: () => {},
      setScore: () => {},
    },
    {
      course_name: '数字电路与逻辑设计',
      teacher_name: '詹青青',
      setComment: () => {},
      setScore: () => {},
    },
    {
      course_name: '数字电路与逻辑设计',
      teacher_name: '詹青青',
      setComment: () => {},
      setScore: () => {},
    },
  ];

  return (
    <View
      className="flex-1"
      style={{ width: screenWidth }}
      onLayout={e => {
        console.log('Layout changed, width:', e.nativeEvent.layout);
      }}
    >
      <FlatList
        data={sampleData}
        renderItem={({ item }) => (
          <CourseCard
            teacher_name={item.teacher_name}
            course_name={item.course_name}
            setComment={item.setComment}
            setScore={item.setScore}
          />
        )}
      />

      <SafeAreaView edges={['bottom']}>
        <Button className="mx-4 mb-6 items-center rounded-lg py-3">
          <Text>提交</Text>
        </Button>
      </SafeAreaView>
    </View>
  );
}

export default function OnekeyCommentFormPage() {
  const [currentTab, setCurrentTab] = useState<Tab>(Tab.学期选课);
  const tabs = [Tab.学期选课, Tab.查成绩];

  return (
    <>
      <Tabs.Screen
        options={{
          title: '一键评议',
        }}
      />

      <PageContainer>
        <TabFlatList
          data={tabs}
          value={currentTab}
          onChange={setCurrentTab as (value: string) => void}
          renderContent={tabname => <TabContent tabname={tabname as Tab} />}
        />
      </PageContainer>
    </>
  );
}
