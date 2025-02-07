import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface BreadcrumbProps {
  currentPath: string;
  setCurrentPath: (path: string) => void;
}

export default function Breadcrumb({ currentPath, setCurrentPath }: BreadcrumbProps) {
  // 处理路径参数
  const pathSegments = currentPath
    .split('/')
    .filter(p => p !== '')
    .reduce((acc: string[], curr, index) => {
      if (index === 0) return [curr];
      return [...acc, `${acc[index - 1]}/${curr}`];
    }, []);

  // 生成面包屑数组
  const breadcrumbs = [
    { name: '根目录', path: '/' },
    ...pathSegments.map(path => ({
      name: path.split('/').pop() || '',
      path,
    })),
  ];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="h-16">
      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1;
        return (
          <View key={item.path} className="h-16 flex-row items-center">
            {index !== 0 && <Text className="mx-1 text-gray-600">&gt;</Text>}
            {!isLast ? (
              <TouchableOpacity
                className="h-16 justify-center"
                onPress={() => setCurrentPath(item.path)}
                activeOpacity={0.7}
              >
                <Text className="ml-1 text-gray-600">{item.name}</Text>
              </TouchableOpacity>
            ) : (
              <Text className="ml-1 text-blue-500">{item.name}</Text>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}
