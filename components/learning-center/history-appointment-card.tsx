import { View } from 'react-native';
import { toast } from 'sonner-native';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';

import ApiService from '@/utils/learning-center/api_service';
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
  onRefresh?: () => void;
}

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
  const appointment = new Appointment(
    id.toString(),
    floor.toString(),
    spaceName,
    date,
    beginTime,
    endTime,
    auditStatus,
    sign,
  );

  const getStatusColor = () => {
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
  };

  const handleCancel = async () => {
    try {
      const response = await ApiService.cancelAppointment(id);
      if (response.code === '0') {
        toast.success('取消预约成功');
        onRefresh?.();
      } else {
        toast.error(`取消预约失败: ${response.msg}`);
      }
    } catch (error: any) {
      toast.error(`取消预约时出错: ${error.message}`);
    }
  };

  const handleSignIn = async () => {
    try {
      const response = await ApiService.signIn(id.toString());
      if (response.code === '0') {
        toast.success('签到成功');
        onRefresh?.();
      } else {
        toast.error(`签到失败: ${response.msg}`);
      }
    } catch (error: any) {
      toast.error(`签到时出错: ${error.message}`);
    }
  };

  const handleSignOut = async () => {
    try {
      const response = await ApiService.signOut(id.toString());
      if (response.code === '0') {
        toast.success('签退成功');
        onRefresh?.();
      } else {
        toast.error(`签退失败: ${response.msg}`);
      }
    } catch (error: any) {
      toast.error(`签退时出错: ${error.message}`);
    }
  };

  const renderActionButtons = () => {
    const statusText = appointment.getStatusText();
    switch (statusText) {
      case '未开始':
        return (
          <Button variant="destructive" className="w-full" onPress={handleCancel}>
            <Text>取消预约</Text>
          </Button>
        );
      case '待签到':
        return (
          <Button variant="default" className="w-full" onPress={handleSignIn}>
            <Text>签到</Text>
          </Button>
        );
      case '已签到':
        return (
          <Button variant="default" className="w-full" onPress={handleSignOut}>
            <Text>签退</Text>
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="mb-4 overflow-hidden rounded-xl border border-border">
      <CardHeader className="flex-row items-center justify-between pb-2 pt-4">
        <CardTitle className="text-lg">{`${floor}F ${spaceName}`}</CardTitle>
        <View className={`rounded-md px-2 py-1 ${getStatusColor().replace('text-', 'bg-').replace('-600', '-100')}`}>
          <Text className={`text-sm font-medium ${getStatusColor()}`}>{appointment.getStatusText()}</Text>
        </View>
      </CardHeader>
      <CardContent className="pb-4">
        <View className="flex flex-row justify-between">
          <View className="flex flex-row items-center">
            <Text className="mr-2 text-text-secondary">日期：</Text>
            <Text>{date}</Text>
          </View>
          <View className="flex flex-row items-center">
            <Text className="mr-2 text-text-secondary">时间：</Text>
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
