import { getApiV1PaperList } from '@/api/generate';
import Breadcrumb from '@/components/Breadcrumb';
import PaperList, { PaperType, type Paper } from '@/components/PaperList';
import { ThemedView } from '@/components/ThemedView';
import { useSafeResponseSolve } from '@/hooks/useSafeResponseSolve';
import { Stack } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

enum LoadingState {
  UNINIT = 'uninit',
  PENDING = 'pending',
  FINISH = 'finish',
  FAILED = 'failed',
}

const noNetworkImage = require('assets/images/toolbox/paper/no_network.png');

export default function PaprerPage() {
  const loadingState = useRef(LoadingState.UNINIT);
  const [currentPath, setCurrentPath] = useState('/');
  const [currentPapers, setCurrentPapers] = useState<Paper[]>([]);
  const { handleError } = useSafeResponseSolve(); // HTTP 请求错误处理

  // 访问 west2-online 服务器
  const getPaperData = useCallback(async () => {
    if (loadingState.current === LoadingState.PENDING) return;
    loadingState.current = LoadingState.PENDING;
    try {
      const result = (await getApiV1PaperList({ path: currentPath })).data;
      const folders: Paper[] = result.data.folders.map(name => ({ name, type: PaperType.FOLDER }));
      const files: Paper[] = result.data.files.map(name => ({ name, type: PaperType.FILE }));
      setCurrentPapers([...folders, ...files]);
      loadingState.current = LoadingState.FINISH;
    } catch (error: any) {
      handleError(error);
      loadingState.current = LoadingState.FAILED;
    }
  }, [loadingState, currentPath, handleError]);

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
