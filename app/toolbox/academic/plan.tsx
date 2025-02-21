import { router, useNavigation } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { toast } from 'sonner-native';

import { ThemedView } from '@/components/ThemedView';

import type { JwchAcademicPlanResponse } from '@/api/backend';
import { getApiV1JwchAcademicPlan } from '@/api/generate';
import { WebParams } from '@/app/(guest)/web';
import Loading from '@/components/loading';
import { useSafeResponseSolve } from '@/hooks/useSafeResponseSolve';

const NAVIGATION_TITLE = '培养计划';

export default function PlanPage() {
  const [isRefreshing, setIsRefreshing] = useState(true); // 按钮是否禁用
  const [planData, setPlanData] = useState<JwchAcademicPlanResponse | null>(null); // 学术成绩数据

  const { handleError } = useSafeResponseSolve(); // HTTP 请求错误处理

  // 设置导航栏标题
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({ title: NAVIGATION_TITLE });
  }, [navigation]);

  // 访问 west2-online 服务器
  const getPlanData = useCallback(async () => {
    try {
      const result = await getApiV1JwchAcademicPlan();
      setPlanData(result.data.data); // 第一个 data 指的是响应 HTTP 的 data 字段，第二个 data 指的是响应数据的 data 字段
      const params: WebParams = {
        url: planData || '',
        jwch: true,
        title: NAVIGATION_TITLE,
      };
      // 跳转不保留当前页
      router.replace({
        pathname: '/(guest)/web',
        params,
      });
    } catch (error: any) {
      const data = handleError(error);
      if (data) {
        toast.error(data.msg ? data.msg : '未知错误');
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [handleError, planData]);

  useEffect(() => {
    getPlanData();
  }, [getPlanData]);

  return <ThemedView className="flex-1 bg-white">{isRefreshing && <Loading />}</ThemedView>;
}
