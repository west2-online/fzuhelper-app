import { fromByteArray } from 'base64-js';
import { Stack } from 'expo-router';
import { RotateCwIcon } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Platform,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
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
import OnekeyComment, { CourseInfo, TextbookInfo } from '@/lib/onekey-comment';
import { LocalUser } from '@/lib/user';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

const DEFAULT_TEACHER_COMMENTS = [
  '学识渊博，品德高尚，思学生所思，为学生而为，是传道授业解惑之良师。',
  '爱岗敬业，严谨治学，为人师表，恪守师道，以德立教，以行化人。',
  '课堂结构完整，层次清楚，突出重点，突破难点，各环衔接紧密，时间安排合理。',
];

const teacherCommentOptions: Option[] = [
  { label: DEFAULT_TEACHER_COMMENTS[0], id: 0 },
  { label: DEFAULT_TEACHER_COMMENTS[1], id: 1 },
  { label: DEFAULT_TEACHER_COMMENTS[2], id: 2 },
  { label: '自己评价', id: 'other' },
];

const ratingOptions: Option[] = [
  { id: 0, label: '非常满意' },
  { id: 1, label: '满意' },
  { id: 2, label: '基本满意' },
  { id: 3, label: '不满意' },
];

export interface EvaluationDimension {
  title: string;
  description: string;
  rating?: string;
}

const textbookEvaluations: EvaluationDimension[] = [
  {
    title: '内容适配性',
    description: '教材内容是否与课程教学目标、授课进度相匹配？',
  },
  {
    title: '内容适用性',
    description: '教材内容是否结构清晰、难度适中、逻辑连贯？',
  },
  {
    title: '编校质量',
    description: '教材印刷是否清晰、排版是否合理、图表符号是否准确清晰？',
  },
  {
    title: '价格合理性',
    description: '教材价格是否合理、适中？',
  },
  {
    title: '整体满意度',
    description: '综合以上维度，对教材的整体评价。',
  },
];

interface CourseState {
  score: string;
  selected: number | 'other' | undefined;
  customText: string;
}

interface TextbookState {
  ratings: (number | undefined)[];
  suggestion: string;
}

const getSatisfactionLabel = (index: number | undefined): string =>
  index !== undefined ? (ratingOptions[index]?.label ?? '') : '';

const getTeacherComment = (state: CourseState): string => {
  if (state.selected === 'other') return state.customText.trim();
  if (state.selected !== undefined) return DEFAULT_TEACHER_COMMENTS[state.selected];
  return '';
};

const Divider: React.FC = () => <View className="my-3 h-[2px] bg-secondary" />;

interface CourseCardProps {
  courseName: string;
  teacherName: string;
  score: string;
  selected: number | 'other' | undefined;
  customText: string;
  onScoreChange: (v: string) => void;
  onSelectedChange: (v: number | 'other' | undefined) => void;
  onCustomTextChange: (v: string) => void;
}

const CourseCard = ({
  courseName,
  teacherName,
  score,
  selected,
  customText,
  onScoreChange,
  onSelectedChange,
  onCustomTextChange,
}: CourseCardProps) => {
  const handleScoreTextChange = useCallback(
    (text: string) => {
      // 移除非数字字符
      const numericText = text.replace(/[^0-9]/g, '');

      // 允许空字符串（便于删除），否则限制在 0-100 范围
      if (numericText === '') {
        onScoreChange('');
        return;
      }
      const num = parseInt(numericText, 10);
      if (!isNaN(num)) {
        onScoreChange(Math.min(Math.max(num, 0), 100).toString());
      }
    },
    [onScoreChange],
  );

  return (
    <View className="mx-4 mt-4 space-y-2 rounded-xl border border-border bg-card p-5">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 gap-1">
          <Text className="font-bold text-text-primary">{courseName}</Text>
          <Text className="break-all text-text-secondary">{teacherName}</Text>
        </View>
        <TextInput
          value={score}
          onChangeText={handleScoreTextChange}
          keyboardType="number-pad"
          placeholder="百分制评分"
          placeholderTextColor="#60a5fa"
          maxLength={3}
          className="h-14 w-32 rounded-xl bg-text-primary/10 text-center text-lg text-text-primary"
          style={styles.textInput}
        />
      </View>
      <Divider />
      <Text className="mb-1 font-bold">选择评语</Text>
      <RadioGroup
        options={teacherCommentOptions}
        selected={selected}
        onChange={onSelectedChange}
        customText={customText}
        onCustomTextChange={onCustomTextChange}
        customPlaceholder="来评价一下老师吧（不少于20字）"
      />
    </View>
  );
};

interface TextbookCardProps {
  courseName: string;
  ratings: (number | undefined)[];
  suggestion: string;
  onRatingChange: (dimIndex: number, value: number | undefined) => void;
  onSuggestionChange: (value: string) => void;
}

const RatingItem = ({
  title,
  description,
  selected,
  onChange,
}: {
  title: string;
  description: string;
  selected: number | undefined;
  onChange: (v: number | undefined) => void;
}) => (
  <View>
    <Text className="font-semibold text-text-primary">{title}</Text>
    <Text className="mb-1 text-sm text-text-secondary">{description}</Text>
    <RadioGroup options={ratingOptions} selected={selected} onChange={v => onChange(v === 'other' ? undefined : v)} />
  </View>
);

const TextbookCard = ({ courseName, ratings, suggestion, onRatingChange, onSuggestionChange }: TextbookCardProps) => (
  <View className="mx-4 mt-4 rounded-xl border border-border bg-card p-5">
    <Text className="font-bold text-text-primary">[教材] {courseName}</Text>
    <Divider />
    <View className="space-y-6">
      {textbookEvaluations.map((dim, index) => (
        <React.Fragment key={dim.title}>
          {index > 0 && <Divider />}
          <RatingItem
            title={dim.title}
            description={dim.description}
            selected={ratings[index]}
            onChange={v => onRatingChange(index, v)}
          />
        </React.Fragment>
      ))}
    </View>
    <Divider />
    <Text className="mb-2 font-semibold text-text-primary">意见与建议</Text>
    <TextInput
      value={suggestion}
      onChangeText={onSuggestionChange}
      keyboardType="default"
      multiline
      numberOfLines={3}
      textAlignVertical="top"
      placeholder="非必填..."
      placeholderTextColor="#9ca3af"
      className="h-24 w-full rounded-lg bg-gray-100 px-4 text-base text-text-primary dark:bg-gray-800"
      style={styles.textInput}
    />
  </View>
);

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

type ListItem = (CourseInfo & { type: 'course'; index: number }) | (TextbookInfo & { type: 'textbook'; index: number });

function TabContent({ tabname, onekey, recaptcha, refreshCaptcha }: TabContentProps) {
  const { width: screenWidth } = useWindowDimensions(); // 获取屏幕宽度
  const [isLoading, setLoading] = useState(true);
  const [courses, setCourses] = useState<CourseInfo[]>([]);
  const [textbooks, setTextbooks] = useState<TextbookInfo[]>([]);
  const [courseStates, setCourseStates] = useState<CourseState[]>([]);
  const [textbookStates, setTextbookStates] = useState<TextbookState[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [recaptchaInput, setCaptchaInput] = useState('');

  const updateCourseScore = useCallback((i: number, v: string) => {
    setCourseStates(prev => {
      const next = [...prev];
      next[i] = { ...next[i], score: v };
      return next;
    });
  }, []);

  const updateCourseSelected = useCallback((i: number, v: number | 'other' | undefined) => {
    setCourseStates(prev => {
      const next = [...prev];
      next[i] = { ...next[i], selected: v };
      return next;
    });
  }, []);

  const updateCourseCustomText = useCallback((i: number, v: string) => {
    setCourseStates(prev => {
      const next = [...prev];
      next[i] = { ...next[i], customText: v };
      return next;
    });
  }, []);

  const updateTextbookRating = useCallback((tbIndex: number, dimIndex: number, value: number | undefined) => {
    setTextbookStates(prev => {
      const next = [...prev];
      const ratings = [...next[tbIndex].ratings];
      ratings[dimIndex] = value;
      next[tbIndex] = { ...next[tbIndex], ratings };
      return next;
    });
  }, []);

  const updateTextbookSuggestion = useCallback((tbIndex: number, value: string) => {
    setTextbookStates(prev => {
      const next = [...prev];
      next[tbIndex] = { ...next[tbIndex], suggestion: value };
      return next;
    });
  }, []);

  const checkForm = useCallback(() => {
    for (let i = 0; i < courses.length; i++) {
      if (courseStates[i]?.score === '') {
        toast.error(`${courses[i].courseName}的评分未填写，请检查后再试！`);
        return false;
      }
      if (getTeacherComment(courseStates[i]) === '') {
        toast.error(`${courses[i].courseName}的评语为空，请检查后再试！`);
        return false;
      }
      if (getTeacherComment(courseStates[i]).length < 20) {
        toast.error(`${courses[i].courseName}的评语少于20字，请检查后再试！`);
        return false;
      }
    }
    for (let i = 0; i < textbooks.length; i++) {
      for (let j = 0; j < textbookEvaluations.length; j++) {
        if (textbookStates[i]?.ratings[j] === undefined) {
          toast.error(`${textbooks[i].courseName}的${textbookEvaluations[j].title}未填写，请检查后再试！`);
          return false;
        }
      }
    }
    return true;
  }, [courses, courseStates, textbooks, textbookStates]);

  const refreshCourses = useCallback(async () => {
    setLoading(true);
    const cookieValid = await LocalUser.checkCredentials();
    if (!cookieValid) {
      try {
        await LocalUser.login();
      } catch (error) {
        console.error('教务系统登录失败:', error);
        toast.error('登录失败，请稍后再试');
        return;
      }
    }
    const { identifier, cookies } = LocalUser.getCredentials();
    onekey.setCookies(cookies);
    const data = await onekey.getUncommentTeachers(identifier, tabname === Tab.学期选课 ? 'xqxk' : 'score');
    setCourses(data);
    setCourseStates(data.map(() => ({ score: '', selected: undefined, customText: '' })));
    // 只有成绩查询才有教材评议
    if (tabname === Tab.成绩查询) {
      const textbookData = await onekey.getUncommentTextbooks(identifier);
      setTextbooks(textbookData);
      setTextbookStates(
        textbookData.map(() => ({
          ratings: new Array(textbookEvaluations.length).fill(undefined),
          suggestion: '',
        })),
      );
    } else {
      setTextbooks([]);
      setTextbookStates([]);
    }

    setLoading(false);
  }, [onekey, tabname]);

  const submitAllForm = useCallback(async () => {
    let errorMsg = '';
    for (let i = 0; i < courses.length; i++) {
      const error = await onekey.commentTeacher(
        courses[i].params,
        courseStates[i].score,
        getTeacherComment(courseStates[i]),
        recaptchaInput,
      );
      if (!error) continue;
      if (error.includes('验证码校验错误')) {
        // 所有请求共用一个验证码，第一个错了就不用继续了
        toast.error('验证码错误');
        refreshCaptcha();
        setCaptchaInput('');
        return;
      }
      errorMsg += `${courses[i].courseName}评议失败：${error}\n`;
    }

    for (let i = 0; i < textbooks.length; i++) {
      const { ratings, suggestion } = textbookStates[i];
      const error = await onekey.commentTextbook(
        textbooks[i].params,
        getSatisfactionLabel(ratings[0]),
        getSatisfactionLabel(ratings[1]),
        getSatisfactionLabel(ratings[2]),
        getSatisfactionLabel(ratings[3]),
        getSatisfactionLabel(ratings[4]),
        suggestion,
        recaptchaInput,
      );
      if (!error) continue;
      if (error.includes('验证码校验错误')) {
        // 所有请求共用一个验证码，第一个错了就不用继续了
        toast.error('验证码错误');
        refreshCaptcha();
        setCaptchaInput('');
        return;
      }
      errorMsg += `[教材] ${textbooks[i].courseName}评议失败：${error}\n`;
    }
    if (errorMsg) {
      toast.error(errorMsg.trim());
    } else {
      toast.success('评议成功！');
    }
    refreshCaptcha();
    setCaptchaInput('');
    refreshCourses();
  }, [courses, courseStates, textbooks, textbookStates, onekey, recaptchaInput, refreshCaptcha, refreshCourses]);

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

  const data: ListItem[] = [
    ...courses.map((item, i) => ({ ...item, type: 'course' as const, index: i })),
    ...textbooks.map((item, i) => ({ ...item, type: 'textbook' as const, index: i })),
  ];

  return (
    <View className="flex-1" style={{ width: screenWidth }}>
      {courses.length !== 0 || textbooks.length !== 0 ? (
        <>
          <FlatList
            renderScrollComponent={props => <KeyboardAwareScrollView keyboardShouldPersistTaps="handled" {...props} />}
            data={data}
            renderItem={({ item }) => {
              if (item.type === 'course') {
                return (
                  <CourseCard
                    teacherName={item.teacherName}
                    courseName={item.courseName}
                    score={courseStates[item.index]?.score ?? ''}
                    selected={courseStates[item.index]?.selected}
                    customText={courseStates[item.index]?.customText ?? ''}
                    onScoreChange={v => updateCourseScore(item.index, v)}
                    onSelectedChange={v => updateCourseSelected(item.index, v)}
                    onCustomTextChange={v => updateCourseCustomText(item.index, v)}
                  />
                );
              }
              return (
                <TextbookCard
                  courseName={item.courseName}
                  ratings={textbookStates[item.index]?.ratings ?? new Array(textbookEvaluations.length).fill(undefined)}
                  suggestion={textbookStates[item.index]?.suggestion ?? ''}
                  onRatingChange={(dimIndex, value) => updateTextbookRating(item.index, dimIndex, value)}
                  onSuggestionChange={value => updateTextbookSuggestion(item.index, value)}
                />
              );
            }}
            refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refreshCourses} />}
            keyExtractor={item => `${item.type}-${item.index}`}
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
              keyboardType={Platform.OS === 'ios' ? 'ascii-capable' : 'visible-password'}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              importantForAutofill="no"
              spellCheck={false}
              autoFocus
              className="mt-1 rounded-xl bg-text-primary/10 px-4 py-2 text-center text-lg text-text-primary"
              style={styles.textInput}
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
      try {
        await LocalUser.login();
      } catch (error) {
        console.error('教务系统登录失败:', error);
        toast.error('登录失败，请稍后再试');
        return;
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
      <Stack.Screen
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
const styles = StyleSheet.create({
  // iOS 文本垂直居中问题修复
  // https://github.com/facebook/react-native/issues/39145#issuecomment-3153012157
  textInput: Platform.OS === 'ios' ? { lineHeight: 0 } : {},
});
