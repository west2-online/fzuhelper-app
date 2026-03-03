import FAQContent from '@/components/faq-content';
import PageContainer from '@/components/page-container';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { FAQ_MAP } from '@/lib/FAQ';
import { getReleaseChannel, ReleaseChannelType } from '@/utils/android-update';
import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Linking, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HelpPage() {
  const insets = useSafeAreaInsets();
  const [releaseChannel, setReleaseChannel] = useState<ReleaseChannelType | null>(null);

  useFocusEffect(
    useCallback(() => {
      getReleaseChannel().then(setReleaseChannel);
    }, []),
  );

  return (
    <>
      <Stack.Screen options={{ title: '帮助与反馈' }} />
      <PageContainer>
        <ScrollView className="px-5" contentContainerStyle={{ paddingBottom: insets.bottom }}>
          <Card className="mb-3 p-5">
            <Text className="text-xl">交流反馈群</Text>
            <Text
              className="mb-1 text-sm text-primary underline"
              onPress={() => {
                if (Platform.OS === 'android') {
                  if (releaseChannel === 'release') {
                    Linking.openURL(
                      'mqqopensdkapi://bizAgent/qm/qr?url=http%3A%2F%2Fqm.qq.com%2Fcgi-bin%2Fqm%2Fqr%3Ffrom%3Dapp%26p%3Dandroid%26jump_from%3Dwebapi%26k%3De7mh6pFzK706glP05IoQ0-WvvK3nlPds',
                    );
                  } else if (releaseChannel === 'beta') {
                    Linking.openURL(
                      'mqqopensdkapi://bizAgent/qm/qr?url=http%3A%2F%2Fqm.qq.com%2Fcgi-bin%2Fqm%2Fqr%3Ffrom%3Dapp%26p%3Dandroid%26jump_from%3Dwebapi%26k%3DgJSPzSlxdONFl8CMwAMEeYvZLnR4Dfu4',
                    );
                  }
                } else if (Platform.OS === 'ios') {
                  Alert.alert(
                    '请选择版本', // 标题
                    '请选择要跳转的反馈交流群', // 信息
                    [
                      {
                        text: '正式版(AppStore)', // 按钮文字
                        onPress: () => {
                          Linking.openURL(
                            'mqqapi://card/show_pslcard?src_type=internal&version=1&uin=169341623&authSig=Um4FdlK2sQbPbaMkgVDSMd7lF36Rni1pKLZRUEKhZMz7XmRe8sUwEzJzJrakD5Rc&card_type=group&source=external&jump_from=webapi',
                          );
                        },
                      },
                      {
                        text: '测试版(TestFlight)', // 按钮文字
                        onPress: () => {
                          Linking.openURL(
                            'mqqapi://card/show_pslcard?src_type=internal&version=1&uin=1020036141&authSig=Um4FdlK2sQbPbaMkgVDSMd7lF36Rni1pKLZRUEKhZMz7XmRe8sUwEzJzJrakD5Rc&card_type=group&source=external&jump_from=webapi',
                          );
                        },
                      },
                      {
                        text: '取消', // 取消按钮
                        style: 'cancel', // iOS 专属样式
                      },
                    ],
                    { cancelable: true }, // 是否允许点击对话框外部关闭
                  );
                } else {
                  Linking.openURL(
                    'https://qm.qq.com/cgi-bin/qm/qr?k=e7mh6pFzK706glP05IoQ0-WvvK3nlPds&jump_from=webapi&authKey=JigcWCU4RK773M3s4XJwMi1wLejFHpN8gHPyhq0i0BFsSaRhqLH9FhgBiPH5qUOO',
                  );
                }
              }}
            >
              点击加入
            </Text>
          </Card>
          {FAQ_MAP.map((item, index) => (
            <Card key={index} className="mb-3 p-5">
              <Text className="text-xl">{item.name}</Text>
              {item.data.map((data, dataIndex) => (
                <FAQContent key={dataIndex} question={data.question} answer={data.answer} />
              ))}
            </Card>
          ))}
        </ScrollView>
      </PageContainer>
    </>
  );
}
