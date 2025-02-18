import { getApiV1PaperList } from '@/api/generate';
import Breadcrumb from '@/components/Breadcrumb';
import PaperList, { PaperType, type Paper } from '@/components/PaperList';
import { ThemedView } from '@/components/ThemedView';
import { useSafeResponseSolve } from '@/hooks/useSafeResponseSolve';
import { Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

enum LoadingState {
  UNINIT = 'uninit',
  PENDING = 'pending',
  FINISH = 'finish', // success or fail
}

export default function PaprerPage() {
  const [loadingState, setLoadingState] = useState(LoadingState.UNINIT);
  const [currentPath, setCurrentPath] = useState('/');
  const [currentPapers, setCurrentPapers] = useState<Paper[]>([]);
  const { handleError } = useSafeResponseSolve(); // HTTP 请求错误处理

  // 访问 west2-online 服务器
  const getPaperData = useCallback(async () => {
    setLoadingState(LoadingState.PENDING);
    try {
      const result = (await getApiV1PaperList({ path: currentPath })).data;
      const folders: Paper[] = result.data.folders.map(name => ({ name, type: PaperType.FOLDER }));
      const files: Paper[] = result.data.files.map(name => ({ name, type: PaperType.FILE }));
      setCurrentPapers([...folders, ...files]);
    } catch (error: any) {
      handleError(error);
    } finally {
      setLoadingState(LoadingState.FINISH);
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
        <PaperList
          papers={currentPapers}
          currentPath={currentPath}
          setCurrentPath={setCurrentPath}
          isRefreshing={loadingState === LoadingState.PENDING || loadingState === LoadingState.UNINIT}
          onRefresh={getPaperData}
        />
      </ThemedView>
    </>
  );
}
