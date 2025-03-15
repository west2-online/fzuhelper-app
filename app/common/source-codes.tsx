import { Stack } from 'expo-router';
import { Linking, ScrollView, View } from 'react-native';

import LabelEntry from '@/components/label-entry';
import PageContainer from '@/components/page-container';
import { Text } from '@/components/ui/text';

export default function SourceCodePage() {
  return (
    <>
      <Stack.Screen options={{ title: '项目源代码' }} />

      <PageContainer>
        <ScrollView className="flex-1 rounded-tr-4xl bg-card px-4 pt-8">
          <LabelEntry
            leftText="客户端"
            rightText="west2-online/fzuhelper-app"
            onPress={() => Linking.openURL('https://github.com/west2-online/fzuhelper-app')}
          />
          <LabelEntry
            leftText="服务端"
            rightText="west2-online/fzuhelper-server"
            onPress={() => Linking.openURL('https://github.com/west2-online/fzuhelper-server')}
          />
          <LabelEntry
            leftText="本科教学系统(对接)"
            rightText="west2-online/jwch"
            onPress={() => Linking.openURL('https://github.com/west2-online/jwch')}
          />
          <LabelEntry
            leftText="研究生教学系统(对接)"
            rightText="west2-online/yjsy"
            onPress={() => Linking.openURL('https://github.com/west2-online/yjsy')}
          />
          <View className="space-y-4">
            <Text className="my-2 text-lg font-bold text-text-secondary">友情提示</Text>
            <Text className="my-2 text-base text-text-secondary">
              本项目为开源项目，欢迎各位同学参与贡献，项目全部位于 Github，可能需要较好的网络环境
            </Text>
            <Text className="my-2 text-base text-text-secondary">
              所列项目受福州大学统一指导，由福州大学计算机与大数据学院、福州大学网络安全与信息化办公室管理（以上单位合称"官方"）。即使源代码使用了宽松开源协议，但仅供学习参考，不允许源代码直接或间接性使用/修改后使用在任何非官方和
              west2-online 外的应用、网站、app 及任何可以与用户产生交互的互联网信息媒介中。该警告具备行政约束效力。
            </Text>
          </View>
        </ScrollView>
      </PageContainer>
    </>
  );
}
