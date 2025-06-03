import { fromByteArray } from 'base64-js';
import { Tabs } from 'expo-router';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Dimensions, Image, TouchableOpacity, View } from 'react-native';
import { FlatList, TextInput } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

import PageContainer from '@/components/page-container';
import RadioGroup, { Option } from '@/components/radio-group';
import { TabFlatList } from '@/components/tab-flatlist';
import FloatModal from '@/components/ui/float-modal';
import OnekeyComment, { CourseInfo } from '@/lib/onekey-comment';
import { LocalUser } from '@/lib/user';
import { RotateCwIcon } from 'lucide-react-native';
import { toast } from 'sonner-native';

interface CourseCardProps {
  courseName: string;
  teacherName: string;
}

const Divider: React.FC = () => <View className="my-3 h-[2px] bg-secondary" />;

const DEFAULT_COMMENTS = [
  '学识渊博，品德高尚，思学生所思，为学生而为，是传道授业解惑之良师。',
  '爱岗敬业、严谨治学、为人师表。',
  '课堂结构完整，层次清楚，突出重点，突破难点，各环衔接紧密，时间安排合理。',
];
const options: Option[] = [
  { label: DEFAULT_COMMENTS[0], id: 0 },
  { label: DEFAULT_COMMENTS[1], id: 1 },
  { label: DEFAULT_COMMENTS[2], id: 2 },
  { label: '自己评价', id: 'other' },
];
interface CourseFormInfo {
  comment: string;
  score: string;
}

interface CourseCardRef {
  getFormData: () => CourseFormInfo;
}

const CourseCard = forwardRef<CourseCardRef, CourseCardProps>(function CourseCard({ courseName, teacherName }, ref) {
  const [score, setScore] = useState('');
  const [selected, setSelected] = useState<number | 'other'>(0);
  const [customText, setCustomText] = useState('');

  useImperativeHandle(ref, () => ({
    getFormData: () => ({
      comment: selected === 'other' ? customText : DEFAULT_COMMENTS[selected],
      score: score,
    }),
  }));

  const handleScoreTextChange = (text: string) => {
    // 移除非数字字符
    const numericText = text.replace(/[^0-9]/g, '');
    const num = parseInt(numericText, 10);

    // 允许空字符串（便于删除），否则限制在 0-100 范围
    if (numericText === '') {
      setScore('');
    } else if (!isNaN(num)) {
      const clamped = Math.min(Math.max(num, 0), 100);
      setScore(clamped.toString());
    }
  };

  return (
    <View className="m-4 space-y-2 rounded-xl border border-border bg-white p-5">
      <View className="flex-row items-center justify-between">
        <View className="">
          <Text className="font-bold text-text-primary">{courseName}</Text>
          <Text className="break-all text-text-secondary">{teacherName}</Text>
        </View>
        <TextInput
          value={score}
          onChangeText={handleScoreTextChange}
          keyboardType="number-pad"
          placeholder="输入评分"
          placeholderTextColor="#60a5fa"
          maxLength={3}
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
        customPlaceholder="来评价一下老师吧"
      />
    </View>
  );
});

enum Tab {
  学期选课 = '学期选课',
  成绩查询 = '成绩查询',
}

interface TabContentProps {
  tabname: Tab;
  onekey: OnekeyComment;
  recaptcha: string;
  refreshRecaptcha: () => void;
}

function TabContent({ tabname, onekey, recaptcha, refreshRecaptcha }: TabContentProps) {
  const screenWidth = Dimensions.get('window').width; // 获取屏幕宽度
  const [courses, setCourses] = useState<CourseInfo[]>([]);
  const [modalVisiable, setModalVisiable] = useState(false);
  const [recaptchaInput, setRecaptchaInput] = useState('');
  const childRefs = useRef<(CourseCardRef | null)[]>([]);
  const getAllFormData = () => {
    const allData: CourseFormInfo[] = [];
    Object.values(childRefs.current).forEach(ref => {
      if (ref && ref.getFormData) {
        allData.push(ref.getFormData());
      }
    });
    return allData;
  };

  const checkForm = () => {
    const allForm = getAllFormData();
    for (let i = 0; i < allForm.length; i++) {
      if (allForm[i].score === '') {
        toast.error(`${courses[i].courseName}的评分未填写，请检查后再试！`);
        return false;
      }
      if (allForm[i].comment === '') {
        toast.error(`${courses[i].courseName}的评语未填写，请检查后再试！`);
        return false;
      }
    }
    return true;
  };

  const refreshCourses = useCallback(async () => {
    const { identifier, cookies } = LocalUser.getCredentials();
    onekey.setCookies(cookies);
    const data = await onekey.getUncommentTeachers(identifier, tabname === Tab.学期选课 ? 'xqxk' : 'score');
    setCourses(data);
  }, [onekey, tabname]);

  const submitAllForm = useCallback(async () => {
    const allForm = getAllFormData();
    for (let i = 0; i < allForm.length; i++) {
      await onekey.commentTeacher(courses[i].params, allForm[i].score, allForm[i].comment, recaptchaInput);
    }
    refreshCourses();
  }, [courses, onekey, recaptchaInput, refreshCourses]);

  useEffect(() => {
    refreshCourses();
  }, [refreshCourses]);

  return (
    <View
      className="flex-1"
      style={{ width: screenWidth }}
      onLayout={e => {
        console.log('Layout changed, width:', e.nativeEvent.layout);
      }}
    >
      {courses.length !== 0 ? (
        <>
          <FlatList
            data={courses}
            renderItem={({ index, item }) => (
              <CourseCard
                teacherName={item.teacherName}
                courseName={item.courseName}
                ref={ref => (childRefs.current[index] = ref)}
              />
            )}
          />
          <SafeAreaView edges={['bottom']}>
            <Button
              className="mx-4 mb-6 items-center rounded-lg py-3"
              onPress={() => {
                if (checkForm()) setModalVisiable(true);
              }}
              disabled={modalVisiable}
            >
              <Text>提交</Text>
            </Button>
          </SafeAreaView>
          <FloatModal
            title="填写验证码"
            visible={modalVisiable}
            onConfirm={() => {
              submitAllForm();
              setModalVisiable(false);
            }}
            onClose={() => setModalVisiable(false)}
          >
            <Image source={{ uri: recaptcha }} className="h-12" resizeMode="contain" />
            <TouchableOpacity className="mt-3 flex-row items-center justify-center" onPress={refreshRecaptcha}>
              <RotateCwIcon size={12} color={'blue'} />
              <Text className="ml-2">看不清，换一张</Text>
            </TouchableOpacity>
            <TextInput
              value={recaptchaInput}
              onChangeText={setRecaptchaInput}
              className="mt-5 rounded-xl bg-text-primary/10 px-4 py-2 text-center text-lg text-text-primary"
            />
          </FloatModal>
        </>
      ) : (
        <View className="flex-1 p-4">
          <View className="rounded-xl border border-border bg-card p-4">
            <Text className="mb-3 text-xl font-bold">当前没有待评议的课程</Text>
            <Text className="mt-2">您已经完成全部课程的评议，或评议尚未开始。</Text>
            <Text className="mt-2">您可以正常前往「{tabname}」页面进行相关操作。</Text>
            <Text className="mt-2">如仍提示需要评议，请在页面顶部切换所需评议的功能，并检查是否全部评议完成。</Text>
          </View>
        </View>
      )}
    </View>
  );
}

export default function OnekeyCommentFormPage() {
  const onekey = useRef(new OnekeyComment());
  const [recaptcha, setRecaptcha] = useState('');
  const [currentTab, setCurrentTab] = useState<Tab>(Tab.学期选课);
  const tabs = [Tab.学期选课, Tab.成绩查询];

  const refreshRecaptcha = useCallback(async () => {
    const { cookies } = LocalUser.getCredentials();
    onekey.current.setCookies(cookies);
    const data = await onekey.current.getCaptcha();
    const base64 = fromByteArray(data);
    const uri = `data:image/gif;base64,${base64}`;
    setRecaptcha(uri);
  }, [onekey]);

  useEffect(() => {
    refreshRecaptcha();
  }, [refreshRecaptcha]);

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
          renderContent={tabname => (
            <TabContent
              tabname={tabname as Tab}
              onekey={onekey.current}
              recaptcha={recaptcha}
              refreshRecaptcha={refreshRecaptcha}
            />
          )}
        />
      </PageContainer>
    </>
  );
}
