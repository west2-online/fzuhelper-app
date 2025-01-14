import { Alert, Text, TextInput } from 'react-native';

import { getApiV1JwchCourseList, getApiV1JwchUserInfo } from '@/api/generate';
import Button from '@/components/Button';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListRow,
  DescriptionListTerm,
} from '@/components/DescriptionList';
import { ThemedView } from '@/components/ThemedView';
import usePersistedQuery from '@/hooks/usePersistedQuery';
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
          onPress={() => {
            test2();
          }}
        >
          ss2
        </Button>

        <Button variant="link">link</Button>

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
