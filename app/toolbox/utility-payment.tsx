import { Stack } from 'expo-router';
import { Alert, Linking, Platform, ScrollView, View } from 'react-native';

import LabelEntry from '@/components/label-entry';
import PageContainer from '@/components/page-container';
import { Text } from '@/components/ui/text';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function UtilityPaymentPage() {
  // 旗山校区
  const handleQishanPayment = () => {
    const campusUrl =
      'link_id=e8211bf013c04e9d83aa95d734f32f32&ccbLCSParam=8DC8F9FB9922B4377D7C0249482800FDA88B56DC2B8072BABC8016DF18AB8C0D81CAD6A6DA2843BB70C766D4B80165D6EF235D4A2C178699DBCD65519B9DAF78874185B566529DAB14BAC790F90D8DCEBDD0F32A20F3B742&THIRD_SYS_ID=999998&CCBget=1&scene=1';
    openCCBApp(campusUrl);
  };

  // 铜盘校区
  const handleTongpanPayment = () => {
    const campusUrl =
      'link_id=e8211bf013c04e9d83aa95d734f32f32&ccbLCSParam=986EF0B603589777C58D731429CE81088A1EC3A42C2B04EF61944BDB73C100D0A8CC011D1D7B648DF393E146B464B616FEFC57A3D0A2052F63D55D68A4F2156F89F1EED336B75FA0FDE4566C6D0BC61A71B93EA0AE145FFD0FF0C27406A40F1A51BE1E8D5D5C18CC81E7EB3CCBBAAA6819E0CCF63856B01E&THIRD_SYS_ID=999998&CCBget=1';
    openCCBApp(campusUrl);
  };

  // 晋江校区
  const handleJinjiangPayment = () => {
    const campusUrl =
      'link_id=e8211bf013c04e9d83aa95d734f32f32&ccbLCSParam=986EF0B603589777C58D731429CE81088A1EC3A42C2B04EF61944BDB73C100D0388609C527E6ED147107B294EA011F6FFEFC57A3D0A2052F63D55D68A4F2156F89F1EED336B75FA004791035948054A671B93EA0AE145FFD0DC643F0F1A1340651BE1E8D5D5C18CC81E7EB3CCBBAAA6819E0CCF63856B01E&THIRD_SYS_ID=999998&CCBget=1';
    openCCBApp(campusUrl);
  };

  // 怡山校区
  const handleYishanPayment = () => {
    const campusUrl =
      'link_id=8c39ab33bca94639b760dc0a160dc1aa&CCBget=1&UTM_SOURCE=sjyhwl&UTM_CONTENT=jiaofei_0_2_0&THIRD_SYS_ID=999998&ccbLCSParam=8DC8F9FB9922B4377D7C0249482800FDA3A635558537140EBC8016DF18AB8C0D81CAD6A6DA2843BB70C766D4B80165D6EF235D4A2C178699DBCD65519B9DAF78874185B566529DAB14BAC790F90D8DCEBDD0F32A20F3B742';
    openCCBApp(campusUrl);
  };

  // 打开建设银行APP
  const openCCBApp = (campusUrl: string) => {
    const ccbUrl = 'ccbapp://ccblink?funcid=01909001&' + campusUrl + '&openflag=1';

    Linking.openURL(ccbUrl).catch(() => {
      Alert.alert('未安装建设银行应用', '查询宿舍水电费需要使用中国建设银行APP，请先安装该应用。', [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '去下载',
          onPress: () => {
            const storeUrl =
              Platform.OS === 'ios'
                ? 'https://apps.apple.com/cn/app/id391965015'
                : 'https://m2.ccb.com/cn/mobilev3/home/include/download.html';

            Linking.openURL(storeUrl).catch(() => {});
          },
        },
      ]);
    });
  };

  return (
    <>
      <Stack.Screen options={{ title: '水电缴费' }} />
      <PageContainer className="p-4">
        <ScrollView>
          <SafeAreaView edges={['bottom']}>
            <View className="mx-4 space-y-4">
              <LabelEntry leftText="旗山校区" onPress={handleQishanPayment} />
              <LabelEntry leftText="铜盘校区" onPress={handleTongpanPayment} />
              <LabelEntry leftText="晋江校区" onPress={handleJinjiangPayment} />
              <LabelEntry leftText="怡山校区" onPress={handleYishanPayment} />
            </View>
            <View className="mx-4 mt-8 space-y-4">
              <Text className="my-2 text-lg font-bold text-text-secondary">操作提示</Text>
              <Text className="my-2 text-base text-text-secondary">
                请选择所在的校区进行水电费查询和缴纳。需要安装中国建设银行APP才能使用此功能。
              </Text>
            </View>
          </SafeAreaView>
        </ScrollView>
      </PageContainer>
    </>
  );
}
