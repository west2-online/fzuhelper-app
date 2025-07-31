import { fromByteArray } from 'base64-js';
import { Tabs } from 'expo-router';
import { RotateCwIcon } from 'lucide-react-native';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Dimensions, FlatList, Image, RefreshControl, TouchableOpacity, View } from 'react-native';
import { TextInput } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import { Button } from '@/components/ui/button';
import FloatModal from '@/components/ui/float-modal';
import { Text } from '@/components/ui/text';

import PageContainer from '@/components/page-container';
import RadioGroup, { Option } from '@/components/radio-group';
import { TabFlatList } from '@/components/tab-flatlist';

import Loading from '@/components/loading';
import OnekeyComment, { CourseInfo } from '@/lib/onekey-comment';
import { LocalUser } from '@/lib/user';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

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
  const [score, setScore] = useState('100');
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
    <View className="mx-4 mt-4 space-y-2 rounded-xl border border-border bg-card p-5">
      <View className="flex-row items-center justify-between">
        <View className="gap-1">
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
          className="h-14 w-28 rounded-xl bg-text-primary/10 text-center text-lg text-text-primary"
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
  refreshCaptcha: () => void;
}

function TabContent({ tabname, onekey, recaptcha, refreshCaptcha }: TabContentProps) {
  const screenWidth = Dimensions.get('window').width; // 获取屏幕宽度
  const [isLoading, setLoading] = useState(true);
  const [courses, setCourses] = useState<CourseInfo[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [recaptchaInput, setCaptchaInput] = useState('');
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
    setLoading(true);
    const cookieValid = await LocalUser.checkCredentials();
    if (!cookieValid) {
      // 如果 Cookie 无效，则重新登录
      const userInfo = LocalUser.getUser();
      if (!userInfo.password || !userInfo.userid) {
        toast.error('登录失效，请重新登录');
        return;
      } else {
        await LocalUser.login();
      }
    }
    const { identifier, cookies } = LocalUser.getCredentials();
    onekey.setCookies(cookies);
    const data = await onekey.getUncommentTeachers(identifier, tabname === Tab.学期选课 ? 'xqxk' : 'score');
    setCourses(data);
    setLoading(false);
  }, [onekey, tabname]);

  const submitAllForm = useCallback(async () => {
    const allForm = getAllFormData();
    for (let i = 0; i < allForm.length; i++) {
      const result = await onekey.commentTeacher(
        courses[i].params,
        allForm[i].score,
        allForm[i].comment,
        recaptchaInput,
      );
      if (!result) {
        toast.error('验证码错误');
        refreshCaptcha();
        setCaptchaInput('');
        return;
      }
    }
    toast.success('评议成功！');
    refreshCaptcha();
    setCaptchaInput('');
    refreshCourses();
  }, [courses, onekey, recaptchaInput, refreshCaptcha, refreshCourses]);

  useEffect(() => {
    refreshCourses();
  }, [refreshCourses]);

  if (isLoading) {
    return (
      <View className="flex-1" style={{ width: screenWidth }}>
        <Loading />
      </View>
    );
  }
  return (
    <View className="flex-1" style={{ width: screenWidth }}>
      {courses.length !== 0 ? (
        <>
          <FlatList
            renderScrollComponent={props => <KeyboardAwareScrollView keyboardShouldPersistTaps="handled" {...props} />}
            data={courses}
            renderItem={({ index, item }) => (
              <CourseCard
                teacherName={item.teacherName}
                courseName={item.courseName}
                ref={ref => {
                  childRefs.current[index] = ref;
                }}
              />
            )}
            refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refreshCourses} />}
          />
          <SafeAreaView edges={['bottom']}>
            <Button
              className="mx-4 mb-6 items-center rounded-lg py-3"
              onPress={() => {
                if (checkForm()) setModalVisible(true);
              }}
              disabled={modalVisible}
            >
              <Text>提交</Text>
            </Button>
          </SafeAreaView>
          <FloatModal
            title="填写验证码"
            visible={modalVisible}
            onConfirm={async () => {
              if (!recaptchaInput) {
                toast.error('验证码不能为空');
                return;
              }
              await submitAllForm();
              setModalVisible(false);
            }}
            onClose={() => setModalVisible(false)}
          >
            <Image source={{ uri: recaptcha }} className="h-12" resizeMode="contain" />
            <TouchableOpacity
              className="flex-row items-center justify-center py-3"
              onPress={refreshCaptcha}
              activeOpacity={0.7}
            >
              <RotateCwIcon size={14} color={'#1089ff'} />
              <Text className="ml-2">看不清，换一张</Text>
            </TouchableOpacity>
            <TextInput
              value={recaptchaInput}
              onChangeText={setCaptchaInput}
              className="mt-1 rounded-xl bg-text-primary/10 px-4 py-2 text-center text-lg text-text-primary"
            />
          </FloatModal>
        </>
      ) : (
        <KeyboardAwareScrollView
          className="flex-1 p-4"
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refreshCourses} />}
        >
          <View className="rounded-xl border border-border bg-card p-4">
            <Text className="mb-3 text-xl font-bold">当前没有待评议的课程</Text>
            <Text className="mt-2">您已经完成全部课程的评议，或评议尚未开始。</Text>
            <Text className="mt-2">您可以正常前往「{tabname}」页面进行相关操作。</Text>
            <Text className="mt-2">如仍提示需要评议，请在页面顶部切换所需评议的功能，并检查是否全部评议完成。</Text>
          </View>
        </KeyboardAwareScrollView>
      )}
    </View>
  );
}

export default function OnekeyCommentFormPage() {
  const onekey = useRef(new OnekeyComment());
  const [recaptcha, setCaptcha] = useState('');
  const [currentTab, setCurrentTab] = useState<Tab>(Tab.学期选课);
  const tabs = [Tab.学期选课, Tab.成绩查询];

  const refreshCaptcha = useCallback(async () => {
    const cookieValid = await LocalUser.checkCredentials();
    if (!cookieValid) {
      // 如果 Cookie 无效，则重新登录
      const userInfo = LocalUser.getUser();
      if (!userInfo.password || !userInfo.userid) {
        toast.error('登录失效，请重新登录');
        return;
      } else {
        await LocalUser.login();
      }
    }
    const { cookies } = LocalUser.getCredentials();
    onekey.current.setCookies(cookies);
    let data = await onekey.current.getCaptcha();
    let base64 = fromByteArray(data);
    if (!base64.startsWith('R0lGODlh')) {
      // 非GIF89a前缀，请求失败，重试一次
      data = await onekey.current.getCaptcha();
      base64 = fromByteArray(data);
    }
    const uri = `data:image/gif;base64,${base64}`;
    setCaptcha(uri);
  }, [onekey]);

  useEffect(() => {
    refreshCaptcha();
  }, [refreshCaptcha]);

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
              refreshCaptcha={refreshCaptcha}
            />
          )}
        />
      </PageContainer>
    </>
  );
}
