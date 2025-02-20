import { getApiV1PaperList } from '@/api/generate';
import Breadcrumb from '@/components/Breadcrumb';
import PaperList, { PaperType, type Paper } from '@/components/PaperList';
import { useSafeResponseSolve } from '@/hooks/useSafeResponseSolve';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Search } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { SafeAreaView, TouchableOpacity } from 'react-native';

enum LoadingState {
  UNINIT = 'uninit',
  PENDING = 'pending',
  FINISH = 'finish', // success or fail
}

interface PaperPageParam {
  path?: string;
}

interface SearchButtonProps {
  currentPath: string;
  papers: Paper[];
}

function SearchButton({ currentPath, papers }: SearchButtonProps) {
  return (
    <TouchableOpacity
      onPress={() =>
        router.push({
          pathname: '/toolbox/paper/search',
          params: { currentPath: currentPath, currentPapers: JSON.stringify(papers) },
        })
      }
      className="p-2"
    >
      <Search size={20} />
    </TouchableOpacity>
  );
}

export default function PaperPage() {
  const [loadingState, setLoadingState] = useState(LoadingState.UNINIT);
  const { path } = useLocalSearchParams<PaperPageParam>();
  const [currentPath, setCurrentPath] = useState(path !== undefined ? path : '/');
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
      <Stack.Screen
        options={{
          title: '历年卷',
          // eslint-disable-next-line react/no-unstable-nested-components
          headerRight: () => <SearchButton currentPath={currentPath} papers={currentPapers} />,
        }}
      />
      <SafeAreaView className="flex-1">
        <Breadcrumb currentPath={currentPath} setCurrentPath={setCurrentPath} />
        <PaperList
          papers={currentPapers}
          currentPath={currentPath}
          setCurrentPath={setCurrentPath}
          isRefreshing={loadingState === LoadingState.PENDING || loadingState === LoadingState.UNINIT}
          onRefresh={getPaperData}
        />
      </SafeAreaView>
    </>
  );
}
