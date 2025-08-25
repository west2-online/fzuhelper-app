import { Stack } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import LabelEntry from '@/components/label-entry';
import PageContainer from '@/components/page-container';
import { Text } from '@/components/ui/text';
import { pushToWebViewNormal } from '@/lib/webview';

const POLICE_REGISTRATION = '闽ICP备19020557号-3';
const ICP_REGISTRATION = '闽ICP备19020557号-4A';
const UNIFIED_SOCIAL_CREDIT_CODE = '91350121MA2Y470F5C';

const URL_BUSINESS_LICENSE =
  'https://west2-online.feishu.cn/wiki/Yco5wRQrOigLzRkWxW9cyTyEnVb#share-JmdRdBLMXo6YqDxI2OScLKJBncf';
const URL_ORGANIZATION_PROOF =
  'https://west2-online.feishu.cn/wiki/Yco5wRQrOigLzRkWxW9cyTyEnVb#share-Z0W2d6bLsobZgnx5Ghcc3sPlnQh';
const URL_WEBSITE_PROOF =
  'https://west2-online.feishu.cn/wiki/Yco5wRQrOigLzRkWxW9cyTyEnVb#share-VlMQdIvuxoBxXAxwpgeczRUGnVc';
const URL_SECURITY_CHECK_RESULT =
  'https://west2-online.feishu.cn/wiki/Yco5wRQrOigLzRkWxW9cyTyEnVb#share-ICs4dLSSroRxDRxFPtgc2K96nTc';

export default function SourceCodePage() {
  return (
    <>
      <Stack.Screen options={{ title: '资质证照信息' }} />

      <PageContainer>
        <ScrollView className="flex-1 rounded-tr-4xl bg-card px-8" contentContainerClassName="pt-8">
          <SafeAreaView edges={['bottom']}>
            <LabelEntry leftText="ICP 备案号" rightText={ICP_REGISTRATION} noIcon disabled />
            <LabelEntry leftText="公安联网备案号" rightText={POLICE_REGISTRATION} noIcon disabled />
            <LabelEntry leftText="统一社会信用代码" rightText={UNIFIED_SOCIAL_CREDIT_CODE} noIcon disabled />
            <LabelEntry
              leftText="营业执照"
              rightText="点击查看"
              onPress={() => pushToWebViewNormal(URL_BUSINESS_LICENSE)}
            />
            <LabelEntry
              leftText="学生组织证明"
              rightText="点击查看"
              onPress={() => pushToWebViewNormal(URL_ORGANIZATION_PROOF)}
            />
            <LabelEntry
              leftText="域名注册信息"
              rightText="点击查看"
              onPress={() => pushToWebViewNormal(URL_WEBSITE_PROOF)}
            />
            <LabelEntry
              leftText="安全检查报告"
              description="福州大学网络安全与信息化办公室提供网络安全等级保护合规检测服务"
              rightText="点击查看"
              onPress={() => pushToWebViewNormal(URL_SECURITY_CHECK_RESULT)}
            />
            <View className="space-y-4">
              <Text className="my-2 text-lg font-bold text-text-secondary">友情提示</Text>
              <Text className="my-2 text-base text-text-secondary">
                如需其他相关信息，请邮件咨询 admin@west2.online
              </Text>
            </View>
          </SafeAreaView>
        </ScrollView>
      </PageContainer>
    </>
  );
}
