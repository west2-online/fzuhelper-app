import { BarCodeScanner } from 'expo-barcode-scanner';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { toast } from 'sonner-native';

import PageContainer from '@/components/page-container';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

import ApiService from '@/utils/learning-center/api_service';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REFRESH_FLAG_KEY = 'learning_center_refresh_needed';

export default function QrScannerPage() {
  const router = useRouter();
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const validateQrCode = (data: string): boolean => {
    try {
      // 检查是否符合格式：seatSignInCode@time1@time2
      const parts = data.split('@');
      if (parts.length !== 3 || parts[0] !== 'seatSignInCode') {
        return false;
      }

      const startTime = new Date(parts[1]);
      const endTime = new Date(parts[2]);
      const currentTime = new Date();

      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        return false;
      }

      // 验证时间间隔为1分钟
      const timeDiffInMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
      if (Math.abs(timeDiffInMinutes - 1) > 0.1) {
        return false;
      }

      // 检查当前时间是否在有效期内
      return currentTime >= startTime && currentTime <= endTime;
    } catch (error) {
      console.error('QR码验证失败:', error);
      return false;
    }
  };

  const handleBarCodeScanned = async ({ data }: { type: string; data: string }) => {
    setScanned(true);
    setScanning(true);
    if (!appointmentId) {
      toast.error('预约ID丢失，请返回重试');
      setScanning(false);
      return;
    }

    if (!validateQrCode(data)) {
      toast.error('二维码无效或已过期');
      setScanning(false);
      return;
    }

    try {
      const response = await ApiService.signIn(appointmentId);
      if (response.code === '0') {
        toast.success('签到成功');
        // 设置需要刷新的标记
        await AsyncStorage.setItem(REFRESH_FLAG_KEY, 'true');
        // 使用router.back()保持导航栈完整
        router.back();
      } else {
        toast.error(`签到失败: ${response.msg}`);
        setScanning(false);
      }
    } catch (error: any) {
      toast.error(`签到时出错: ${error.message}`);
      setScanning(false);
    }
  };

  const handleScanAgain = () => setScanned(false);

  if (hasPermission === null) {
    return (
      <PageContainer className="flex-1 items-center justify-center bg-background">
        <Text>请求相机权限中...</Text>
      </PageContainer>
    );
  }

  if (hasPermission === false) {
    return (
      <PageContainer className="flex-1 items-center justify-center bg-background">
        <Text className="mb-4 text-center">需要相机权限以扫描二维码</Text>
        <Button onPress={() => router.back()}>返回</Button>
      </PageContainer>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: '扫码签到' }} />
      <PageContainer className="flex-1 bg-background">
        <View className="flex-1">
          <BarCodeScanner
            onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
            style={StyleSheet.absoluteFillObject}
          />
          <View className="absolute bottom-0 left-0 right-0 bg-black/50 p-4">
            <Text className="mb-4 text-center text-white">将二维码放入框内以进行扫描</Text>
            {scanned && !scanning && (
              <View className="flex-row justify-center space-x-2">
                <Button onPress={handleScanAgain} className="w-1/2">
                  <Text>再次扫描</Text>
                </Button>
                <Button variant="outline" onPress={() => router.back()} className="w-1/2">
                  <Text>返回</Text>
                </Button>
              </View>
            )}
          </View>
        </View>
      </PageContainer>
    </>
  );
}
