// 用于测试api 的页面

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import ApiService from '@/utils/learning-center/api_service';
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { toast } from 'sonner-native';

// 用于生成符合后端要求的日期格式
const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = ('0' + (date.getMonth() + 1)).slice(-2);
  const day = ('0' + date.getDate()).slice(-2);
  return `${year}-${month}-${day}`;
};

export default function TestApi() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const [date, setDate] = useState(formatDate(Date.now() + 24 * 60 * 60 * 3000)); // 初始化为三天后的日期
  const [beginTime, setStartTime] = useState('22:00'); // 开始时间
  const [endTime, setEndTime] = useState('23:00'); // 结束时间
  const [spaceName, setSpaceName] = useState('1');
  const [floor, setFloor] = useState('4');
  const [appointmentID, setAppointmentID] = useState('');
  const api = useMemo(() => new ApiService(token), [token]);

  // 错误处理
  const handleError = (error: any) => {
    toast.error(error.message);
  };

  // 测试历史记录
  const history = async () => {
    const response = await api
      .fetchAppointments({
        currentPage: 1,
        pageSize: 30,
        auditStatus: '',
      })
      .catch(handleError);
    console.log(response);
  };
  // 测试查询指定楼层的座位
  const querySeatStatus = async () => {
    const response = await api
      .querySeatStatus({
        date,
        beginTime,
        endTime,
        floor,
      })
      .catch(handleError);
    console.log(response);
  };

  // 测试预约
  const order = async () => {
    const response = await api
      .makeAppointment({
        date,
        beginTime,
        endTime,
        spaceName,
      })
      .catch(handleError);
    console.log(response);
  };

  // 测试签到
  const signin = async () => {
    const response = await api.signIn(appointmentID).catch(handleError);
    console.log(response);
  };

  // 测试签退
  const signout = async () => {
    const response = await api.signOut(appointmentID).catch(handleError);
    console.log(response);
  };
  // 测试取消
  const cancel = async () => {
    const response = await api.cancelAppointment(appointmentID).catch(handleError);
    console.log(response);
  };

  return (
    <View>
      <Text>token:{token}</Text>
      {/* 测试预约历史 */}
      <Button onPress={history}>
        <Text>查询历史记录</Text>
      </Button>
      {/* 测试查询指定层的座位 */}

      {/* 测试预约功能 */}
      <Input value={floor} onChangeText={setFloor} placeholder="楼层" keyboardType="numeric" />
      <Input value={date} onChangeText={setDate} placeholder="日期" keyboardType="numeric" />
      <Input value={beginTime} onChangeText={setStartTime} placeholder="开始时间" keyboardType="numeric" />
      <Input value={endTime} onChangeText={setEndTime} placeholder="结束时间" keyboardType="numeric" />
      <Input value={spaceName} onChangeText={setSpaceName} placeholder="座位号" keyboardType="numeric" />
      <Button onPress={querySeatStatus}>
        <Text>
          查询 {floor} 楼 {date} {beginTime}-{endTime} 的座位
        </Text>
      </Button>
      <Button onPress={order}>
        <Text>
          预约 {date} {beginTime}-{endTime} 的 {spaceName}
        </Text>
      </Button>
      {/* 测试签到 */}
      <Input value={appointmentID} onChangeText={setAppointmentID} placeholder="预约ID" keyboardType="numeric" />
      <Button onPress={signin}>
        <Text>测试签到 {appointmentID}</Text>
      </Button>

      <Button onPress={signout}>
        <Text>测试签退 {appointmentID}</Text>
      </Button>
      <Button onPress={cancel}>
        <Text>测试取消 {appointmentID}</Text>
      </Button>
    </View>
  );
}
