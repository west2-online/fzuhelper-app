import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Platform, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { toast } from 'sonner-native';

export default function Web() {
  const [canGoBack, setCanGoBack] = useState(false);
  const [webpageTitle, setWebpageTitle] = useState('');
  const [currentUrl, setCurrentUrl] = useState(''); // 当前加载的 URL
  const webViewRef = useRef<WebView>(null);

  // 读取传递的参数
  const { url, cookie, title } = useLocalSearchParams<{
    url: string; // URL 地址
    cookie?: string; // （可选）Cookie
    title?: string; // （可选）未 Loading 结束时的标题
  }>();

  const headers = cookie ? { Cookie: cookie } : [];
  var htmlData = ``; // 用于存储 HTML 数据

  const onAndroidBackPress = useCallback(() => {
    if (canGoBack) {
      webViewRef.current?.goBack();
      return true; // 阻止默认行为（退出应用）
    }
    return false;
  }, [canGoBack]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      BackHandler.addEventListener('hardwareBackPress', onAndroidBackPress);
      return () => {
        BackHandler.removeEventListener('hardwareBackPress', onAndroidBackPress);
      };
    }
  }, [onAndroidBackPress]);

  // 处理新窗口打开事件
  const onOpenWindow = (event: { nativeEvent: { targetUrl: any } }) => {
    const targetUrl = event.nativeEvent.targetUrl; // 获取目标 URL
    console.log('Opening new window with URL:', targetUrl);

    // 在当前 WebView 中加载目标 URL
    if (webViewRef.current) {
      setCurrentUrl(targetUrl); // 更新当前 URL
    }
  };

  // 刷新页面
  const handleRefresh = useCallback(() => {
    if (webViewRef.current) {
      webViewRef.current.reload(); // 重新加载当前页面
    }
  }, []);

  // 打印当前页面
  const handlePrint = useCallback(async () => {
    try {
      const { uri } = await Print.printToFileAsync({
        html: htmlData,
        margins: {
          left: 20,
          top: 50,
          right: 20,
          bottom: 100,
        },
      }); // 生成 PDF 文件
      console.log('PDF 文件已生成，路径为:', uri);
      // 打印生成的 PDF 文件
      await Print.printAsync({ uri });
      toast.success('打印请求已发送');
      // 删除生成的 PDF 文件
      await FileSystem.deleteAsync(uri, { idempotent: true });
    } catch (error: any) {
      toast.error('打印失败，请重试(' + error.message + ')');
      console.error('打印失败:', error);
    }
  }, [htmlData]);

  return (
    <>
      {/* 如果传递了 title 参数，则使用它；否则使用网页标题 */}
      <Stack.Screen options={{ title: title || webpageTitle }} />
      <View className="flex-row justify-center space-x-4">
        <Button onPress={handleRefresh}>
          <Text>刷新页面</Text>
        </Button>
        <Button onPress={handlePrint}>
          <Text>打印该页面</Text>
        </Button>
      </View>
      <SafeAreaView className="h-full w-full" edges={['bottom']}>
        <WebView
          source={{ uri: currentUrl || url || '', headers: headers }} // 使用当前 URL 或传递的 URL
          allowsBackForwardNavigationGestures={true} // 启用手势返回（iOS）
          ref={webViewRef}
          cacheEnabled={true} // 启用缓存
          cacheMode={'LOAD_DEFAULT'} // 设置缓存模式，LOAD_DEFAULT 表示使用默认缓存策略
          onLoadProgress={event => {
            setCanGoBack(event.nativeEvent.canGoBack);
          }} // 更新是否可以返回（Android）
          javaScriptEnabled={true} // 确保启用 JavaScript
          scalesPageToFit={true} // 启用页面缩放（Android）
          renderToHardwareTextureAndroid={true} // 启用硬件加速（Android）
          setBuiltInZoomControls={true} // 启用内置缩放控件（Android）
          setDisplayZoomControls={false} // 隐藏缩放控件图标
          contentMode="mobile" // 内容模式设置为移动模式，即可自动调整页面大小（iOS）
          allowsInlineMediaPlayback={true} // 允许内联播放媒体（iOS）
          onNavigationStateChange={event => {
            if (!event.loading) {
              // 更新当前 URL
              setCurrentUrl(event.url);

              // 更新网页标题
              if (event.title && !title) {
                setWebpageTitle(event.title); // 只有在没有传递 title 参数时才更新标题
              }
            }
          }}
          injectedJavaScript={`window.ReactNativeWebView.postMessage(document.documentElement.innerHTML)`}
          onOpenWindow={onOpenWindow} // 处理新窗口打开事件
          onMessage={event => {
            htmlData = event.nativeEvent.data;
          }} // 保存 HTML 数据，以便后续打印
        />
      </SafeAreaView>
    </>
  );
}
