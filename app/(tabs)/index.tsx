import { Alert, Button, Text, TextInput } from 'react-native';

import { getApiV1JwchCourseList, getApiV1JwchUserInfo } from '@/api/generate';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListRow,
  DescriptionListTerm,
} from '@/components/DescriptionList';
import { ThemedView } from '@/components/ThemedView';
import usePersistedQuery from '@/hooks/usePersistedQuery';
import ExpoUmengModule from '@/modules/umeng-bridge';
import { useState } from 'react';

export default function HomePage() {
  const [term, setTerm] = useState('202401');
  const { data, isLoading } = usePersistedQuery({
    queryKey: ['getApiV1JwchCourseList', term],
    queryFn: () =>
      getApiV1JwchCourseList({
        term,
      }),
  });
  async function test2() {
    const data = {
      term: '202401',
    };
    const res = await getApiV1JwchUserInfo(data);
    Alert.alert(JSON.stringify(res));
  }

  return (
    <>
      <ThemedView>
        <Text>{isLoading}</Text>
        <TextInput value={term} onChangeText={text => setTerm(text)} />
        <Text>{JSON.stringify(data, null, 2)}</Text>

        <Button
          title="ss2"
          onPress={() => {
            test2();
          }}
        />

        <Button
          title="已同意协议 初始化友盟"
          onPress={() => {
            ExpoUmengModule.initUmeng();
          }}
        />

        <Button
          title="取是否授予通知权限"
          onPress={() => {
            Alert.alert(ExpoUmengModule.hasPermission().toString());
          }}
        />

        <Button
          title="请求通知权限"
          onPress={() => {
            ExpoUmengModule.requirePermission();
          }}
        />

        <DescriptionList>
          <DescriptionListRow>
            <DescriptionListTerm>Term</DescriptionListTerm>
            <DescriptionListDescription>{term}</DescriptionListDescription>
          </DescriptionListRow>
          <DescriptionListRow>
            <DescriptionListTerm>Term</DescriptionListTerm>
            <DescriptionListDescription>{term}</DescriptionListDescription>
          </DescriptionListRow>
          <DescriptionListRow>
            <DescriptionListTerm>Term</DescriptionListTerm>
            <DescriptionListDescription>{term}</DescriptionListDescription>
          </DescriptionListRow>
        </DescriptionList>
      </ThemedView>
    </>
  );
}
