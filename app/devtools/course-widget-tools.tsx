import PageContainer from '@/components/page-container';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { COURSE_WIDGET_DEBUG_SCENARIO_KEY } from '@/lib/constants';
import { CourseCache } from '@/lib/course';
import {
  COURSE_WIDGET_DEBUG_SCENARIOS,
  getCourseWidgetDebugScenario,
  type CourseWidgetDebugScenario,
} from '@/lib/course-widget-debug';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

export default function CourseWidgetToolsPage() {
  const [widgetScenario, setWidgetScenario] = useState<CourseWidgetDebugScenario | null>(null);
  const [widgetBusy, setWidgetBusy] = useState(true);

  useEffect(() => {
    if (!__DEV__) return;
    getCourseWidgetDebugScenario()
      .then(setWidgetScenario)
      .catch(error => toast.error(`读取小组件模拟设置失败：${error}`))
      .finally(() => setWidgetBusy(false));
  }, []);

  const applyWidgetScenario = async (scenario: CourseWidgetDebugScenario | null) => {
    setWidgetBusy(true);
    try {
      await CourseCache.load();
      if (scenario) {
        await AsyncStorage.setItem(COURSE_WIDGET_DEBUG_SCENARIO_KEY, scenario);
      } else {
        await AsyncStorage.removeItem(COURSE_WIDGET_DEBUG_SCENARIO_KEY);
      }
      setWidgetScenario(scenario);
      const hasWidgetData = await CourseCache.syncWidgetData(true);
      if (hasWidgetData) {
        toast.success(scenario ? '模拟课程已同步到小组件' : '已恢复真实课表');
      } else {
        toast.info('已关闭模拟，请打开课表页同步真实课程');
      }
    } catch (error) {
      toast.error(`更新小组件数据失败：${error}`);
    } finally {
      setWidgetBusy(false);
    }
  };

  if (!__DEV__ || (Platform.OS !== 'android' && Platform.OS !== 'ios')) {
    return <Redirect href="/devtools" />;
  }

  return (
    <>
      <Stack.Screen options={{ title: '课程小组件' }} />

      <PageContainer>
        <KeyboardAwareScrollView className="h-full" keyboardShouldPersistTaps="handled">
          <SafeAreaView edges={['bottom']}>
            <Text className="mx-3 mb-3 text-sm text-text-secondary">
              仅替换今日／明日课程小组件的数据，不修改课表和自定义课程。模拟数据会保留，测试后请恢复真实课表。
            </Text>
            <Text className="mx-3 mb-3 text-sm">
              当前场景：
              {COURSE_WIDGET_DEBUG_SCENARIOS.find(item => item.value === widgetScenario)?.label ?? '真实课表'}
            </Text>
            {COURSE_WIDGET_DEBUG_SCENARIOS.map(scenario => (
              <Button
                key={scenario.value}
                variant={widgetScenario === scenario.value ? 'default' : 'outline'}
                disabled={widgetBusy}
                onPress={() => applyWidgetScenario(scenario.value)}
              >
                <Text>{scenario.label}</Text>
              </Button>
            ))}
            {widgetScenario === 'tomorrow' && (
              <Text className="mx-3 my-2 text-sm text-text-secondary">
                小号组件可开启「提前显示明日课程」查看明日数据。
              </Text>
            )}
            <Button variant="secondary" disabled={widgetBusy} onPress={() => applyWidgetScenario(null)}>
              <Text>恢复真实课表</Text>
            </Button>
          </SafeAreaView>
        </KeyboardAwareScrollView>
      </PageContainer>
    </>
  );
}
