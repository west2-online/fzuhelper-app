import { Text } from '@/components/ui/text';
import { FolderIcon, getFileIcon, guessFileType } from '@/lib/filetype';
import { router } from 'expo-router';
import React from 'react';
import { FlatList, Image, TouchableOpacity, View } from 'react-native';

export enum PaperType {
  FOLDER = 'folder',
  FILE = 'file',
}

export interface Paper {
  // 当前路径下的文件/文件夹名字
  name: string;
  type: PaperType;
}

type PaperListProps = React.ComponentPropsWithRef<typeof View> & {
  papers: Paper[];
  currentPath: string;
  setCurrentPath: (path: string) => void;
};

function renderPaperItem(paper: Paper, currentPath: string, setCurrentPath: (path: string) => void) {
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
          console.log(`open file: ${currentPath}/${name}`);
          router.push({ pathname: '/toolbox/paper/file-preview', params: { filepath: path } });
        }
      }}
      className="h-16 w-full flex-row items-center px-4 py-2"
    >
      <Image source={icon} className={`mr-6 ${type === 'folder' ? 'h-6 w-6' : 'h-8 w-8'}`} resizeMode="contain" />
      <Text numberOfLines={2} ellipsizeMode="tail" className="flex-1 text-base">
        {name}
      </Text>
    </TouchableOpacity>
  );
}

export default function PaperList({ papers, currentPath, setCurrentPath, ...props }: PaperListProps) {
  return (
    <FlatList
      data={papers}
      className="h-full"
      renderItem={({ item }) => {
        return renderPaperItem(item, currentPath, setCurrentPath);
      }}
    />
  );
}
