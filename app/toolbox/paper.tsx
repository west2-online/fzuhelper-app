import { getApiV1PaperList } from '@/api/generate';
import { ThemedView } from '@/components/ThemedView';
import { useSafeResponseSolve } from '@/hooks/useSafeResponseSolve';
import { useNavigation } from 'expo-router';
import { useCallback, useLayoutEffect, useState } from 'react';
import { ScrollView } from 'react-native';

interface Paper {
  // 当前路径下的文件/文件夹名字
  name: string;
  type: 'folder' | 'file';
}

type LoadingState = 'pending' | 'finish' | 'failed';

const NAVIGATION_TITLE = '历年卷';

export default function PaprerPage() {
  const [loadingState, setLoadingState] = useState<LoadingState>('pending');
  const [currentPath, setCurrentPath] = useState('/');
  const [currentPapers, setCurrentPapers] = useState<Paper[]>();
  const { handleError } = useSafeResponseSolve(); // HTTP 请求错误处理

  // 设置导航栏标题
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({ title: NAVIGATION_TITLE });
  }, [navigation]);

  // 访问 west2-online 服务器
  const getPaperData = useCallback(async () => {
    if (loadingState === 'pending') return;
    setLoadingState('pending');
    try {
      const result = (await getApiV1PaperList({ path: currentPath })).data;
      const folders: Paper[] = result.data.folders.map(name => {
        return { name: name, type: 'folder' };
      });
      const files: Paper[] = result.data.files.map(name => {
        return { name: name, type: 'file' };
      });
      setCurrentPapers([...folders, ...files]);
      setLoadingState('finish');
    } catch (error: any) {
      const data = handleError(error);
      setLoadingState('failed');
    }
  }, [loadingState, currentPath, handleError]);

  return (
    <ThemedView className="flex-1">
      <ScrollView contentContainerStyle={{ padding: 16 }}></ScrollView>
    </ThemedView>
  );
}
