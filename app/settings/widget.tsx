import { requestPinAppWidget } from '@/modules/native-widget';
import { Stack } from 'expo-router';
import { Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import LabelEntry from '@/components/label-entry';
import PageContainer from '@/components/page-container';
import { Text } from '@/components/ui/text';

import { pushToWebViewNormal } from '@/lib/webview';
import { toast } from 'sonner-native';

export default function WidgetPage() {
  // private val REQUEST_NEXT_CLASS = 72201
  // private val REQUEST_COURSE_TABLE = 72202

  return (
    <>
      <Stack.Screen options={{ title: '桌面小部件' }} />

      <PageContainer>
        <ScrollView className="flex-1 px-8" contentContainerClassName="pt-8">
          <Text className="mb-2 text-sm text-text-secondary">点击你要的小部件，将它添加到桌面</Text>

          <LabelEntry
            leftText="下节课上什么"
            onPress={async () => {
              const success = requestPinAppWidget(72201);
              if (success) {
                toast.success('添加小部件成功，请回到桌面查看');
              } else {
                toast.error('添加小部件未成功，可通过下方链接查看解决方案');
              }
            }}
          />

          {Platform.OS === 'android' && (
            <LabelEntry
              leftText="课程表"
              onPress={async () => {
                const success = requestPinAppWidget(72202);
                if (success) {
                  toast.success('添加小部件成功，请回到桌面查看');
                } else {
                  toast.error('添加小部件未成功，可通过下方链接查看解决方案');
                }
              }}
            />
          )}
        </ScrollView>
        <SafeAreaView edges={['bottom']}>
          <Text
            className="mx-auto mb-12 text-primary"
            onPress={() => pushToWebViewNormal('https://west2-online.feishu.cn/wiki/SitbwKuLriaL5bk7Wbicxdf7nYb')}
          >
            添加不成功？点我查看解决方案
          </Text>
        </SafeAreaView>
      </PageContainer>
    </>
  );
}
