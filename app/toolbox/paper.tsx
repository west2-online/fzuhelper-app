import { getApiV1PaperList } from '@/api/generate';
import Breadcrumb from '@/components/Breadcrumb';
import PaperList, { PaperType, type Paper } from '@/components/PaperList';
import { ThemedView } from '@/components/ThemedView';
import { useSafeResponseSolve } from '@/hooks/useSafeResponseSolve';
import { Stack } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

type LoadingState = 'pending' | 'finish' | 'failed';
const noNetworkImage = require('assets/images/toolbox/paper/no_network.png');

export default function PaprerPage() {
  // 只用于组件渲染
  const [loadingState, setLoadingState] = useState<LoadingState>('pending');
  // 只用于避免重复请求
  const isLoading = useRef(false);
  const [currentPath, setCurrentPath] = useState('/');
  const [currentPapers, setCurrentPapers] = useState<Paper[]>([]);
  const { handleError } = useSafeResponseSolve(); // HTTP 请求错误处理

  // 访问 west2-online 服务器
  const getPaperData = useCallback(async () => {
    if (isLoading.current) return;
    isLoading.current = true;
    setLoadingState('pending');
    try {
      const result = (await getApiV1PaperList({ path: currentPath })).data;
      const folders: Paper[] = result.data.folders.map(name => ({ name, type: PaperType.FOLDER }));
      const files: Paper[] = result.data.files.map(name => ({ name, type: PaperType.FILE }));
      setCurrentPapers([...folders, ...files]);
      setLoadingState('finish');
    } catch (error: any) {
      handleError(error);
      setLoadingState('failed');
    } finally {
      isLoading.current = false;
    }
  }, [currentPath, handleError]);

  useEffect(() => {
    getPaperData();
  }, [getPaperData]);

  return (
    <>
      <Stack.Screen options={{ title: '历年卷' }} />
      <ThemedView className="flex-1">
        <Breadcrumb currentPath={currentPath} setCurrentPath={setCurrentPath} />
        <PaperList papers={currentPapers} currentPath={currentPath} setCurrentPath={setCurrentPath} />
      </ThemedView>
    </>
  );
}
