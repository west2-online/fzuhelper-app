import { Buffer } from 'buffer';
import React, { useRef, useState } from 'react';
import { Alert, Button, Image, Text, TextInput, View } from 'react-native';

import { ThemedView } from '@/components/ThemedView';
import { get, post } from '@/modules/native-request';

const URLS = {
  LOGIN_CHECK: 'https://jwcjwxt1.fzu.edu.cn/logincheck.asp',
  VERIFY_CODE: 'https://jwcjwxt1.fzu.edu.cn/plus/verifycode.asp',
  SSO_LOGIN: 'https://jwcjwxt2.fzu.edu.cn/Sfrz/SSOLogin',
  LOGIN_CHECK_XS: 'https://jwcjwxt2.fzu.edu.cn:81/loginchk_xs.aspx',
  GET: 'https://www.baidu.com',
};

const HEADERS = {
  REFERER: 'https://jwch.fzu.edu.cn',
  ORIGIN: 'https://jwch.fzu.edu.cn',
};

const STUDENT = {
  ID: 'student-id',
  PASSWORD: 'student-password-md5-16',
};

interface Cookie {
  [key: string]: string;
}

let cookies: Cookie = {};

export default function HomePage() {
  const [dictionary, setDictionary] = useState<{ [key: string]: string }>({});
  const [imageUrl, setImageUrl] = useState<string | null>(null); // 用于显示验证码图片
  const [captcha, setCaptcha] = useState<string>(''); // 用于输入验证码

  const updateCookies = (newCookies: string) => {
    const cookieArray = newCookies.split(',').map(cookie => cookie.trim());
    const updatedCookies: { [key: string]: string } = { ...cookies };

    cookieArray.forEach(cookie => {
      const [key, value] = cookie.split(';')[0].split('=');
      if (updatedCookies[key]) {
        updatedCookies[key] = value; // 更新现有的 cookie
      } else {
        updatedCookies[key] = value; // 添加新的 cookie
      }
    });
    cookies = updatedCookies;
    console.log('Updated cookies:', updatedCookies);
    // 处理后的 cookies可能长这样
    // {"ASPSESSIONIDCGTRTCDD": "PDHEKIDAJILFAFPPHEDEPDKP", "Learun_ADMS_V7_Mark": "eac94f18-be04-4e74-81cd-96fa6b16251d", "Learun_ADMS_V7_Token": "a25f83b3-6147-4e4e-9d77-e718e0aa83c2"}
  };

  const handleError = (error: any) => {
    Alert.alert('错误', String(error));
  };

  const requestPOST = async (
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
      if (respHeaders['Set-Cookie']) {
        updateCookies(respHeaders['Set-Cookie']);
      }
      return respData;
    } catch (error) {
      handleError(error);
    }
  };

  const requestGET = async (
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
      if (respHeaders['Set-Cookie']) {
        updateCookies(respHeaders['Set-Cookie']);
      }
      if (isBinary) {
        setImageUrl(
          `data:image/png;base64,${btoa(String.fromCharCode(...respData))}`,
        );
      }
      return respData;
    } catch (error) {
      handleError(error);
    }
  };

  const handleSubmitCaptcha = async () => {
    if (!captcha) {
      Alert.alert('错误', '请输入验证码');
      return;
    }
    // Login Check
    const respdata = await requestPOST(
      URLS.LOGIN_CHECK,
      {
        ...HEADERS,
        Cookie: Object.entries(cookies)
          .map(([k, v]) => `${k}=${v}`)
          .join('; '),
      },
      {
        muser: STUDENT.ID,
        passwd: STUDENT.PASSWORD,
        Verifycode: captcha,
      },
    );
    // 我们禁用了 302 重定向，因此这个提取是从 URL 中提取的（但注意到教务处的 HTTP 报文 Body 也提供了 URL，我们从 Body 中入手，不走 Header 的 Location 字段）
    var dataStr = Buffer.from(respdata).toString('utf-8').replace(/\s+/g, '');
    const tokenMatch = /token=(.*?)&/.exec(dataStr);
    const idMatch = /id=(.*?)&/.exec(dataStr);
    const numMatch = /num=(.*?)&/.exec(dataStr);
    if (!tokenMatch) {
      Alert.alert('错误', '缺失 Token');
      return;
    }
    const token = tokenMatch[1];
    const id = idMatch ? idMatch[1] : '';
    const num = numMatch ? numMatch[1] : '';
    console.log('Token:', token, 'ID:', id, 'Num:', num);

    // SSOLogin
    const respSSOData = await requestPOST(
      URLS.SSO_LOGIN,
      {
        'X-Requested-With': 'XMLHttpRequest',
      },
      {
        token: token,
      },
    );
    // 正常响应应当为：{"code":200,"info":"登录成功","data":{}}
    dataStr = Buffer.from(respSSOData).toString('utf-8').replace(/\s+/g, '');

    // account conflict 是 400，正常则是 200
    if (JSON.parse(dataStr).code == 200) {
      const updatedCookies = Object.entries(cookies)
        .map(([k, v]) => `${k}=${v}`)
        .join('; ');
      // LoginCheckXS
      const respCookiesData = await requestGET(
        URLS.LOGIN_CHECK_XS +
          `?id=${id}&num=${num}&ssourl=https://jwcjwxt2.fzu.edu.cn&hosturl=https://jwcjwxt2.fzu.edu.cn:81&ssologin=`,
        {
          ...HEADERS,
          Cookie: updatedCookies,
        },
      );
      // 后续会在 Response Header 中获取 Cookie，这个是我们所需的
      const dataStr = Buffer.from(respCookiesData)
        .toString('binary')
        .replace(/\s+/g, '');
      const idMatch = /id=(.*?)&/.exec(dataStr);
      console.log('ID:', idMatch ? idMatch[1] : '');
    }
  };

  return (
    <>
      <ThemedView>
        <Text>User</Text>
        <Button
          title="获取数据POST"
          onPress={() => requestPOST(URLS.LOGIN_CHECK, HEADERS, {})}
        />
        <Button
          title="获取数据GET"
          onPress={() => requestGET(URLS.GET, HEADERS)}
        />
        <Button
          title="获取验证码图片"
          onPress={() => requestGET(URLS.VERIFY_CODE, {}, true)}
        />
        <TextInput
          value={captcha}
          onChangeText={setCaptcha}
          placeholder="请输入验证码"
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            margin: 10,
            padding: 5,
          }}
        />
        <Button title="尝试进行登录" onPress={handleSubmitCaptcha} />
        <Button
          title="清空 Cookie"
          onPress={() => {
            cookies = {};
          }}
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
