import ArrowRightIcon from '@/assets/images/toolbox/paper/icon_arrow_right.png';
import { useEffect, useRef } from 'react';
import { FlatList, Image, Text, TouchableOpacity, View } from 'react-native';

interface BreadcrumbProps {
  currentPath: string;
  setCurrentPath: (path: string) => void;
}

export default function Breadcrumb({ currentPath, setCurrentPath }: BreadcrumbProps) {
  const flatListRef = useRef<FlatList>(null);

  // 总是滚动到最后一项
  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [currentPath]);

  // 处理路径参数
  // '/a/b' -> ['a', 'a/b']
  const pathSegments = currentPath
    .split('/')
    .filter(p => p !== '')
    .reduce((acc: string[], curr, index) => {
      if (index === 0) return [curr];
      return [...acc, `${acc[index - 1]}/${curr}`];
    }, []);

  // 生成面包屑数组
  // ['a'] => [{ name:'根目录', path: '/'},
  //           { name:'a', path: '/a'}]
  const breadcrumbs = [
    { name: '根目录', path: '/' },
    ...pathSegments.map(path => ({
      name: path.split('/').pop() || '',
      path,
    })),
  ];

  return (
    <FlatList
      ref={flatListRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      className="h-16 flex-grow-0 bg-white"
      contentContainerClassName="px-3"
      data={breadcrumbs}
      renderItem={({ item, index }) => {
        const isLast = index === breadcrumbs.length - 1;
        return (
          <View key={item.path} className="h-16 flex-row items-center">
            {index !== 0 && <Image source={ArrowRightIcon} className="h-3.5 w-3.5" resizeMode="contain" />}
            {!isLast ? (
              <TouchableOpacity
                className="h-16 justify-center"
                onPress={() => setCurrentPath(item.path)}
                activeOpacity={0.7}
              >
                <Text className="mx-1 text-gray-600">{item.name}</Text>
              </TouchableOpacity>
            ) : (
              <Text className="mx-1 text-primary">{item.name}</Text>
            )}
          </View>
        );
      }}
    />
  );
}
