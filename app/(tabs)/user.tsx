import React, { useState } from 'react';
import { Alert, Button, Text } from 'react-native';

import { ThemedView } from '@/components/ThemedView';
import { get, post } from '@/modules/native-request';

export default function HomePage() {
  const [dictionary, setDictionary] = useState<{ [key: string]: string }>({});

  const url = 'https://jwcjwxt1.fzu.edu.cn/logincheck.asp';
  const headers = {
    Referer: 'https://jwch.fzu.edu.cn',
    Origin: 'https://jwch.fzu.edu.cn',
    Cookie: 'ASPSESSIONIDAGRSTDCC=JADPAJABIJOFHMALKENMNHCP',
  };
  const formData = {
    Verifycode: '111',
    muser: 'student-id',
    passwd: 'student-password',
  };

  const handlePress = async () => {
    try {
      const response = await post(url, headers, formData);
      setDictionary(response);
      Alert.alert('结果', response);
    } catch (error) {
      Alert.alert('错误', String(error));
    }
  };

  return (
    <>
      <ThemedView>
        <Text>User</Text>
        <Button title="获取数据" onPress={handlePress} />
        {Object.entries(dictionary).map(([key, value]) => (
          <Text key={key}>
            {key}: {value}
          </Text>
        ))}
      </ThemedView>
    </>
  );
}
