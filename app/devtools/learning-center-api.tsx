// 用于测试 api 的页面

import PageContainer from '@/components/page-container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { LearningCenterContext } from '@/context/learning-center';
import { router, Stack } from 'expo-router';
import { useCallback, useContext, useState } from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import { toast } from 'sonner-native';

// 用于生成符合后端要求的日期格式
const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = ('0' + (date.getMonth() + 1)).slice(-2);
  const day = ('0' + date.getDate()).slice(-2);
  return `${year}-${month}-${day}`;
};

export default function LearningCenterApi() {
  const [date, setDate] = useState(formatDate(Date.now() + 24 * 60 * 60 * 3000)); // 初始化为三天后的日期
  const [beginTime, setStartTime] = useState(''); // 开始时间
  const [endTime, setEndTime] = useState(''); // 结束时间
  const [spaceName, setSpaceName] = useState('');
  const [floor, setFloor] = useState('');
  const [appointmentID, setAppointmentID] = useState('');
  const { api, token, setToken } = useContext(LearningCenterContext);

  // 错误处理
  const handleError = (error: any) => {
    toast.error(error.message);
  };

  // 测试历史记录
  const history = useCallback(async () => {
    const response = await api
      .fetchAppointments({
        currentPage: 1,
        pageSize: 30,
        auditStatus: '',
      })
      .catch(handleError);
    console.log(response);
  }, [api]);

  // 测试查询指定楼层的座位
  const querySeatStatus = useCallback(async () => {
    const response = await api
      .querySeatStatus({
        date,
        beginTime,
        endTime,
        floor,
      })
      .catch(handleError);
    console.log(response);
  }, [api, date, beginTime, endTime, floor]);

  // 测试预约
  const order = useCallback(async () => {
    const response = await api
      .makeAppointment({
        date,
        beginTime,
        endTime,
        spaceName,
      })
      .catch(handleError);
    console.log(response);
  }, [api, date, beginTime, endTime, spaceName]);

  // 测试签到
  const signin = useCallback(async () => {
    const response = await api.signIn(appointmentID).catch(handleError);
    console.log(response);
  }, [api, appointmentID]);

  // 测试签退
  const signout = useCallback(async () => {
    const response = await api.signOut(appointmentID).catch(handleError);
    console.log(response);
  }, [api, appointmentID]);

  // 测试取消
  const cancel = useCallback(async () => {
    const response = await api.cancelAppointment(appointmentID).catch(handleError);
    console.log(response);
  }, [api, appointmentID]);

  // 测试扫码
  const scan = useCallback(async () => {
    router.push({ pathname: '/toolbox/learning-center/qr-scanner', params: { appointmentID } });
  }, [appointmentID]);

  return (
    <PageContainer className="p-4">
      <ScrollView>
        <Stack.Screen options={{ title: '学习中心', headerTransparent: true }} />
        <Input value={token} onChangeText={setToken} placeholder="token" className="my-1" />

        {/* 测试预约历史 */}
        <Button onPress={history} className="my-1">
          <Text>查询历史记录</Text>
        </Button>

        {/* 测试预约功能 */}
        <Input
          value={floor}
          onChangeText={setFloor}
          className="my-1"
          placeholder="楼层(e.g. 4)"
          keyboardType="numeric"
        />
        <Input
          value={date}
          onChangeText={setDate}
          className="my-1"
          placeholder="日期(e.g. 2025-03-15)"
          keyboardType="numeric"
        />
        <Input
          value={beginTime}
          onChangeText={setStartTime}
          className="my-1"
          placeholder="开始时间(e.g. 22:00)"
          keyboardType="numeric"
        />
        <Input
          value={endTime}
          onChangeText={setEndTime}
          className="my-1"
          placeholder="结束时间(e.g. 23:00)"
          keyboardType="numeric"
        />
        <Input
          value={spaceName}
          onChangeText={setSpaceName}
          className="my-1"
          placeholder="座位号(e.g. 1)"
          keyboardType="numeric"
        />
        <Button onPress={querySeatStatus} className="my-1">
          <Text>
            查询 {floor} 楼 {date} {beginTime}-{endTime} 的座位
          </Text>
        </Button>
        <Button onPress={order} className="my-1">
          <Text>
            预约 {date} {beginTime}-{endTime} 的 {spaceName}
          </Text>
        </Button>
        {/* 测试签到 */}
        <Input
          value={appointmentID}
          onChangeText={setAppointmentID}
          className="my-1"
          placeholder="预约ID"
          keyboardType="numeric"
        />
        <Button onPress={signin} className="my-1">
          <Text>签到 {appointmentID}</Text>
        </Button>

        <Button onPress={signout} className="my-1">
          <Text>签退 {appointmentID}</Text>
        </Button>
        <Button onPress={cancel} className="my-1">
          <Text>取消 {appointmentID}</Text>
        </Button>
        <Button onPress={scan} className="my-1">
          <Text>强制跳转到 {appointmentID} 的扫码页面</Text>
        </Button>
      </ScrollView>
    </PageContainer>
  );
}
