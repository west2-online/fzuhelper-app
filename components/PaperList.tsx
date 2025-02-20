import { Text } from '@/components/ui/text';
import { FolderIcon, getFileIcon, guessFileType } from '@/lib/filetype';
import { router } from 'expo-router';
import { memo } from 'react';
import { FlatList, Image, RefreshControl, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Loading from './loading';

export enum PaperType {
  FOLDER = 'folder',
  FILE = 'file',
}

export interface Paper {
  // 当前路径下的文件/文件夹名字
  name: string;
  type: PaperType;
}

interface PaperItemProps {
  paper: Paper;
  currentPath: string;
  setCurrentPath: (path: string) => void;
}

type PaperListProps = React.ComponentPropsWithRef<typeof View> & {
  papers: Paper[];
  currentPath: string;
  setCurrentPath: (path: string) => void;
  isRefreshing: boolean;
  onRefresh: () => void;
};

const PaperItem = memo(function PaperItem({ paper, currentPath, setCurrentPath }: PaperItemProps) {
  const { name, type } = paper;
  let icon;
  if (type === PaperType.FOLDER) {
    icon = FolderIcon;
  } else {
    const filetype = guessFileType(name);
    icon = getFileIcon(filetype);
  }

  return (
    <TouchableOpacity
      onPress={() => {
        const path = currentPath === '/' ? `/${name}` : `${currentPath}/${name}`;
        if (type === 'folder') {
          setCurrentPath(path);
        } else {
          // 导航到文件预览界面
          router.push({ pathname: '/toolbox/paper/file-preview', params: { filepath: path } });
        }
      }}
      className="h-16 w-full flex-row items-center px-6 py-2"
    >
      {/* 由于文件夹和文件的图标大小不一样，需要使用不同的 size */}
      <Image source={icon} className={`mr-6 ${type === 'folder' ? 'h-5 w-8' : 'h-8 w-8'}`} resizeMode="contain" />
      <Text numberOfLines={2} ellipsizeMode="tail" className="flex-1 text-base">
        {name}
      </Text>
    </TouchableOpacity>
  );
});

export default function PaperList({
  papers,
  currentPath,
  setCurrentPath,
  isRefreshing,
  onRefresh,
  ...props
}: PaperListProps) {
  const insets = useSafeAreaInsets();

  return isRefreshing ? (
    <Loading className="flex-1" />
  ) : (
    <FlatList
      data={papers}
      className="flex-1"
      contentContainerStyle={{
        paddingBottom: insets.bottom,
      }}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      renderItem={({ item }) => <PaperItem paper={item} currentPath={currentPath} setCurrentPath={setCurrentPath} />}
    />
  );
}
