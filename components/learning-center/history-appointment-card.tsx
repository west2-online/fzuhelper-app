import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { toast } from 'sonner-native';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';

import ApiService from '@/utils/learning-center/api-service';
import { Appointment } from '@/utils/learning-center/history-appointment-status';

export interface AppointmentCardProps {
  id: number;
  spaceName: string;
  floor: number;
  date: string;
  beginTime: string;
  endTime: string;
  regionName: string;
  seatCode: string;
  auditStatus: number;
  sign?: boolean;
  onRefresh?: () => Promise<void>;
}

// 渲染卡片
export default function HistoryAppointmentCard({
  id, // 预约 ID
  spaceName, // 座位号
  floor,
  date,
  beginTime,
  endTime,
  auditStatus, // 预约状态
  sign = false, // 是否已签到
  onRefresh, // 刷新回调函数
}: AppointmentCardProps) {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>(); // 从路由参数中获取token
  const api = useMemo(() => new ApiService(token), [token]);
  const appointment = useMemo(
    () => new Appointment(id.toString(), floor.toString(), spaceName, date, beginTime, endTime, auditStatus, sign),
    [id, floor, spaceName, date, beginTime, endTime, auditStatus, sign],
  );
  const [isProcessing, setIsProcessing] = useState(false); // 控制取消预约按钮状态
  const [forceUpdateKey, setForceUpdateKey] = useState(0); // 用于强制刷新按钮的状态

  const getStatusColor = useCallback(() => {
    const statusText = appointment.getStatusText();
    switch (statusText) {
      case '未开始':
        return 'text-blue-600';
      case '待签到':
        return 'text-yellow-600';
      case '已签到':
        return 'text-green-600';
      case '未签到':
        return 'text-red-600';
      case '已取消':
        return 'text-gray-500';
      case '已完成':
        return 'text-green-600';
      default:
        return 'text-gray-500';
    }
  }, [appointment]);

  // 处理取消预约
  const handleCancel = useCallback(async () => {
    // 尝试取消预约，如果失败则显示错误信息
    try {
      await api.cancelAppointment(id.toString());
      toast.success('取消预约成功');
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error: any) {
      toast.error(`取消预约失败: ${error.message}`);
    } finally {
      setIsProcessing(false);
      setForceUpdateKey(prev => prev + 1);
    }
  }, [api, id, onRefresh]);

  // 处理签到
  const handleSignIn = useCallback(async () => {
    try {
      // 跳转到二维码扫描页面并传递预约ID
      router.push({
        pathname: '/toolbox/learning-center/qr-scanner',
        params: { appointmentId: id.toString(), token: token },
      });
    } catch (error: any) {
      toast.error(`打开扫码页面失败: ${error.message}`);
    }
  }, [router, id, token]);

  // 处理签退
  const handleSignOut = useCallback(async () => {
    try {
      await api.signOut(id.toString());
      toast.success('签退成功');
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error: any) {
      toast.error(`签退失败: ${error.message}`);
    } finally {
      setIsProcessing(false);
      setForceUpdateKey(prev => prev + 1);
    }
  }, [api, id, onRefresh]);

  // 渲染底部功能按钮
  const renderActionButtons = useCallback(() => {
    switch (appointment.getStatusText()) {
      case '未开始':
        return (
          <Button
            key={forceUpdateKey}
            variant="destructive"
            className="w-full"
            onPress={() => {
              setIsProcessing(true);
              handleCancel();
            }}
            disabled={isProcessing}
          >
            <Text>{isProcessing ? '正在取消' : '取消预约'}</Text>
          </Button>
        );
      case '待签到':
        return (
          <Button variant="default" className="w-full" onPress={handleSignIn}>
            <Text>扫码签到</Text>
          </Button>
        );
      case '已签到':
        return (
          <Button
            key={forceUpdateKey}
            variant="default"
            className="w-full"
            onPress={() => {
              setIsProcessing(true);
              handleSignOut();
            }}
            disabled={isProcessing}
          >
            <Text>{isProcessing ? '正在签退' : '签退'}</Text>
          </Button>
        );
      default:
        return null;
    }
  }, [appointment, handleCancel, handleSignIn, handleSignOut, isProcessing, forceUpdateKey]);

  // 渲染卡片
  return (
    <Card className="mb-4 overflow-hidden rounded-xl border border-border">
      <CardHeader className="flex-row items-center justify-between pb-2 pt-4">
        <CardTitle>
          <Text className="text-lg">{`${floor}层 ${spaceName}`}</Text>
          <Text className="text-sm"> # {id}</Text>
        </CardTitle>
        <View className={`rounded-md px-2 py-1 ${getStatusColor().replace('text-', 'bg-').replace('-600', '-100')}`}>
          <Text className={`text-sm font-medium ${getStatusColor()}`}>{appointment.getStatusText()}</Text>
        </View>
      </CardHeader>
      <CardContent className="pb-4">
        <View className="flex flex-row justify-between">
          <View className="flex flex-row items-center">
            <Text className="mr-2 text-text-secondary">日期</Text>
            <Text>{date}</Text>
          </View>
          <View className="flex flex-row items-center">
            <Text className="mr-2 text-text-secondary">时间</Text>
            <Text>{`${beginTime} - ${endTime}`}</Text>
          </View>
        </View>
      </CardContent>

      {renderActionButtons() && (
        <CardFooter className="border-t border-border px-6 py-4">{renderActionButtons()}</CardFooter>
      )}
    </Card>
  );
}
