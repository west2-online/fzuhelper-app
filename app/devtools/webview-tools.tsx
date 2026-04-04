import PageContainer from '@/components/page-container';
import RadioButton from '@/components/radio-button';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { pushToWebViewJWCH, pushToWebViewNormal, pushToWebViewSSO } from '@/lib/webview';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

type WebViewMode = 'jwch' | 'sso' | 'normal';

const WEBVIEW_MODE_OPTIONS: { value: WebViewMode; label: string }[] = [
  { value: 'jwch', label: 'JWCH' },
  { value: 'sso', label: 'SSO' },
  { value: 'normal', label: 'Normal' },
];

const PRESET_LINKS: { label: string; url: string }[] = [
  {
    label: '选课内页',
    url: 'https://jwcjwxt2.fzu.edu.cn:81/student/glxk/xqxk/xqxk_kclist.aspx',
  },
  {
    label: '辅修选课内页',
    url: 'https://jwcjwxt2.fzu.edu.cn:81/student/glxk/erzyxk/erzyxk_kclist.aspx',
  },
  {
    label: '校选课内页',
    url: 'https://jwcjwxt2.fzu.edu.cn:81/student/glxk/xxk/xxk_kclist.aspx',
  },
  {
    label: '重修选课内页',
    url: 'https://jwcjwxt2.fzu.edu.cn:81/student/glxk/cxxk/cxxk_kclist.aspx',
  },
];

function openWebView(url: string, mode: WebViewMode, title?: string) {
  switch (mode) {
    case 'jwch':
      pushToWebViewJWCH(url, title);
      break;
    case 'sso':
      pushToWebViewSSO(url, title);
      break;
    case 'normal':
      pushToWebViewNormal(url, title);
      break;
  }
}

export default function WebViewToolsPage() {
  const [customUrl, setCustomUrl] = useState('');
  const [mode, setMode] = useState<WebViewMode>('normal');

  const openCustomUrl = () => {
    const trimmed = customUrl.trim();
    if (!trimmed) {
      toast.error('请输入 URL');
      return;
    }
    openWebView(trimmed, mode);
  };

  return (
    <>
      <Stack.Screen options={{ title: 'WebView Tools' }} />

      <PageContainer>
        <KeyboardAwareScrollView className="h-full" keyboardShouldPersistTaps="handled">
          <SafeAreaView edges={['bottom']}>
            {/* 快捷按钮 */}
            <Text style={styles.sectionTitle}>Preset Links (JWCH)</Text>
            {PRESET_LINKS.map(item => (
              <Button key={item.url} onPress={() => openWebView(item.url, 'jwch', item.label)}>
                <Text>{item.label}</Text>
              </Button>
            ))}

            {/* 自定义 URL */}
            <Text style={styles.sectionTitle}>Custom URL</Text>
            <TextInput
              style={styles.input}
              placeholder="请输入 URL"
              value={customUrl}
              onChangeText={setCustomUrl}
              autoCapitalize="none"
              keyboardType="url"
            />
            <View className="my-2">
              <RadioButton
                options={WEBVIEW_MODE_OPTIONS}
                selectedValue={mode}
                onChange={value => setMode(value as WebViewMode)}
              />
            </View>
            <Button onPress={openCustomUrl}>
              <Text>Open URL</Text>
            </Button>
          </SafeAreaView>
        </KeyboardAwareScrollView>
      </PageContainer>
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
    marginLeft: 10,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginVertical: 10,
    margin: 10,
  },
});
