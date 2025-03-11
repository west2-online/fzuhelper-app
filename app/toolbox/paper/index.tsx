import { getApiV1PaperList } from '@/api/generate';
import Breadcrumb from '@/components/Breadcrumb';
import { Icon } from '@/components/Icon';
import PageContainer from '@/components/page-container';
import PaperList, { PaperType, type Paper } from '@/components/PaperList';
import useApiRequest from '@/hooks/useApiRequest';
import { useFocusEffect } from '@react-navigation/native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
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
  const { path } = useLocalSearchParams<PaperPageParam>();
  const [currentPath, setCurrentPath] = useState(path !== undefined ? path : '/');
  const { data: paperData, status: loadingState, refetch } = useApiRequest(getApiV1PaperList, { path: currentPath });
  const currentPapers = useMemo(() => {
    if (paperData) {
      const folders: Paper[] = paperData.folders.map(name => ({ name, type: PaperType.FOLDER }));
      const files: Paper[] = paperData.files.map(name => ({ name, type: PaperType.FILE }));
      return [...folders, ...files];
    } else {
      return [];
    }
  }, [paperData]);

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

  return (
    <>
      <Stack.Screen
        options={{
          title: '历年卷',
          headerTransparent: true,
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
          isRefreshing={loadingState === 'pending'}
          onRefresh={refetch}
        />
      </PageContainer>
    </>
  );
}
