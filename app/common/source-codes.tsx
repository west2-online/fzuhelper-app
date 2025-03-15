import { Stack } from 'expo-router';
import { Linking, Pressable, View } from 'react-native';

import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListRow,
  DescriptionListTerm,
} from '@/components/DescriptionList';
import { Icon } from '@/components/Icon';
import PageContainer from '@/components/page-container';
import { Text } from '@/components/ui/text';

export default function SourceCodePage() {
  return (
    <>
      <Stack.Screen options={{ title: '项目源码' }} />

      <PageContainer>
        <View className="flex-1 rounded-tr-4xl bg-card px-4 pt-8">
          <DescriptionList className="gap-6">
            <Pressable onPress={() => Linking.openURL('https://github.com/west2-online/fzuhelper-app')}>
              <DescriptionListRow>
                <DescriptionListTerm>
                  <Text>客户端</Text>
                </DescriptionListTerm>
                <DescriptionListDescription>
                  <Icon name="chevron-forward" size={14} />
                </DescriptionListDescription>
              </DescriptionListRow>
            </Pressable>
            <Pressable onPress={() => Linking.openURL('https://github.com/west2-online/fzuhelper-server')}>
              <DescriptionListRow>
                <DescriptionListTerm>
                  <Text>服务端</Text>
                </DescriptionListTerm>
                <DescriptionListDescription>
                  <Icon name="chevron-forward" size={14} />
                </DescriptionListDescription>
              </DescriptionListRow>
            </Pressable>
            <Pressable onPress={() => Linking.openURL('https://github.com/west2-online/jwch')}>
              <DescriptionListRow>
                <DescriptionListTerm>
                  <Text>本科教学管理系统（对接）</Text>
                </DescriptionListTerm>
                <DescriptionListDescription>
                  <Icon name="chevron-forward" size={14} />
                </DescriptionListDescription>
              </DescriptionListRow>
            </Pressable>
            <Pressable onPress={() => Linking.openURL('https://github.com/west2-online/yjsy')}>
              <DescriptionListRow>
                <DescriptionListTerm>
                  <Text>研究生教育管理信息系统（对接）</Text>
                </DescriptionListTerm>
                <DescriptionListDescription>
                  <Icon name="chevron-forward" size={14} />
                </DescriptionListDescription>
              </DescriptionListRow>
            </Pressable>
          </DescriptionList>
        </View>
      </PageContainer>
    </>
  );
}
