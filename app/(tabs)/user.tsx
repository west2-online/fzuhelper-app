import { Buffer } from 'buffer';
import React, { useState } from 'react';
import { Alert, Button, Image, Text, View } from 'react-native';

import { ThemedView } from '@/components/ThemedView';
import { get, post } from '@/modules/native-request';

export default function HomePage() {
  const [dictionary, setDictionary] = useState<{ [key: string]: string }>({});
  const [imageUrl, setImageUrl] = useState<string | null>(null); // 用于显示验证码图片

  const urlLoginCheck = 'https://jwcjwxt1.fzu.edu.cn/logincheck.asp';
  const urlVerifyCode = 'https://jwcjwxt1.fzu.edu.cn/plus/verifycode.asp';
  const urlGet = 'https://www.baidu.com';
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

  const handlePress = async (
    url: string,
    headers: Record<string, string>,
    formData: Record<string, string>,
  ) => {
    try {
      const {
        status: respStatus,
        data: respData,
        headers: respHeaders,
      } = await post(url, headers, formData);
      setDictionary(respHeaders);
      Alert.alert(
        '结果',
        respStatus +
          '\n' +
          JSON.stringify(Buffer.from(respData).toString('utf-8')), // 这里默认了 PSOT 返回的是 JSON 数据
      );
    } catch (error) {
      Alert.alert('错误', String(error));
    }
  };

  const handlePressGet = async (
    url: string,
    headers: Record<string, string>,
    isBinary = false, // 是否为二进制数据，如果是的话转为 base64输出（只是测试，我们认为二进制数据就是图片）
  ) => {
    try {
      const {
        status: respStatus,
        data: respData,
        headers: respHeaders,
      } = await get(url, headers);
      setDictionary(respHeaders);
      // 根据 Content-Type 处理响应数据(可能需要内置一个映射表？)
      if (isBinary) {
        // 图片
        const base64Data = btoa(String.fromCharCode(...respData));
        const imageUrl = `data:image/png;base64,${base64Data}`;
        setImageUrl(imageUrl); // 保存图片 URL 到状态
      } else {
        // 其他（默认为文本）
        const responseData = Buffer.from(respData).toString('utf-8'); // 使用 Buffer 解码
        Alert.alert('结果', respStatus + '\n' + responseData);
      }
    } catch (error) {
      Alert.alert('错误', String(error));
    }
  };

  return (
    <>
      <ThemedView>
        <Text>User</Text>
        <Button
          title="获取数据POST"
          onPress={() => handlePress(urlLoginCheck, headers, formData)}
        />
        <Button
          title="获取数据GET"
          onPress={() => handlePressGet(urlGet, headers)}
        />
        <Button
          title="获取验证码图片"
          onPress={() => handlePressGet(urlVerifyCode, headers, true)}
        />
        {Object.entries(dictionary).map(([key, value]) => (
          <Text key={key}>
            {key}: {value}
          </Text>
        ))}
        {imageUrl && ( // 如果有图片 URL
          <View style={{ marginTop: 20, marginLeft: 20 }}>
            <Image
              source={{ uri: imageUrl }}
              style={{ width: 120, height: 35 }}
              resizeMode="stretch" // 使用 stretch 来确保图片填满指定的宽高
            />
          </View>
        )}
      </ThemedView>
    </>
  );
}
