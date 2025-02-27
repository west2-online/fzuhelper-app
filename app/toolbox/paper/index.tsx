import { getApiV1PaperList } from '@/api/generate';
import Breadcrumb from '@/components/Breadcrumb';
import { Icon } from '@/components/Icon';
import PageContainer from '@/components/page-container';
import PaperList, { PaperType, type Paper } from '@/components/PaperList';
import { useSafeResponseSolve } from '@/hooks/useSafeResponseSolve';
import { LoadingState } from '@/types/loading-state';
import { useFocusEffect } from '@react-navigation/native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { BackHandler, Platform } from 'react-native';

interface PaperPageParam {
  path?: string;
}

interface SearchButtonProps {
  currentPath: string;
  papers: Paper[];
}

function SearchButton({ currentPath, papers }: SearchButtonProps) {
  return (
    <Icon
      name="search"
      onPress={() =>
        router.push({
          pathname: '/toolbox/paper/search',
          params: { currentPath: currentPath, currentPapers: JSON.stringify(papers) },
        })
      }
    />
  );
}

export default function PaperPage() {
  const [loadingState, setLoadingState] = useState(LoadingState.UNINIT);
  const { path } = useLocalSearchParams<PaperPageParam>();
  const [currentPath, setCurrentPath] = useState(path !== undefined ? path : '/');
  const [currentPapers, setCurrentPapers] = useState<Paper[]>([]);
  const { handleError } = useSafeResponseSolve(); // HTTP 请求错误处理

  // 使用 useFocusEffect 替代 useEffect
  useFocusEffect(
    useCallback(() => {
      let backHandler: any;

      if (Platform.OS === 'android') {
        backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
          if (currentPath === '/') {
            return false;
          }
          const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
          setCurrentPath(parentPath);
          return true;
        });
      }

      // 清理函数
      return () => {
        if (backHandler) {
          backHandler.remove();
        }
      };
    }, [currentPath]),
  );

  // 访问 west2-online 服务器
  const getPaperData = useCallback(async () => {
    setLoadingState(LoadingState.PENDING);
    try {
      const result = (await getApiV1PaperList({ path: currentPath })).data;
      const folders: Paper[] = result.data.folders.map(name => ({ name, type: PaperType.FOLDER }));
      const files: Paper[] = result.data.files.map(name => ({ name, type: PaperType.FILE }));
      setCurrentPapers([...folders, ...files]);
      setLoadingState(LoadingState.SUCCESS);
    } catch (error: any) {
      handleError(error);
      setLoadingState(LoadingState.FAILED);
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
      <PageContainer>
        <Breadcrumb currentPath={currentPath} setCurrentPath={setCurrentPath} />
        <PaperList
          papers={currentPapers}
          currentPath={currentPath}
          setCurrentPath={setCurrentPath}
          isRefreshing={loadingState === LoadingState.PENDING || loadingState === LoadingState.UNINIT}
          onRefresh={getPaperData}
        />
      </PageContainer>
    </>
  );
}
