import PageContainer from '@/components/page-container';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useColorScheme } from '@/lib/useColorScheme';
import * as FileCache from '@/utils/file-cache';
import Clipboard from '@react-native-clipboard/clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import { Stack } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, TextInput, View } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import * as mime from 'react-native-mime-types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

export default function FileCachePage() {
  const [cachedFiles, setCachedFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'size'>('name');
  const [ascending, setAscending] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const files = await FileCache.listCachedFiles();
      setCachedFiles(files || []);
    } catch (e) {
      toast.error('刷新缓存失败: ' + e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const deleteOne = async (uri: string) => {
    try {
      await FileSystem.deleteAsync(uri, { idempotent: true });
      toast.success('删除成功');
      await refresh();
    } catch (e) {
      toast.error('删除失败: ' + e);
    }
  };

  const openFile = async (uri: string) => {
    try {
      if (Platform.OS === 'android') {
        // ReactNativeBlobUtil.android.actionViewIntent 需要绝对文件路径（不带 file: 前缀）
        let path = uri;
        if (path.startsWith('file://')) {
          path = path.replace(/^file:\/\//, '');
        } else if (path.startsWith('file:/')) {
          path = path.replace(/^file:\//, '/');
        }
        // 确保以 / 开头
        if (!path.startsWith('/')) path = '/' + path;
        ReactNativeBlobUtil.android.actionViewIntent(path, mime.lookup(uri) || 'application/octet-stream');
      } else {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri);
        } else {
          toast.info('分享/打开不支持此设备');
        }
      }
    } catch (e) {
      toast.error('打开文件失败: ' + e);
    }
  };

  const copyPath = (uri: string) => {
    try {
      Clipboard.setString(uri);
      toast.success('路径已复制');
    } catch (e) {
      toast.error('复制失败: ' + e);
    }
  };

  const displayedFiles = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = cachedFiles.filter(f => {
      if (!q) return true;
      return (f.name || '').toLowerCase().includes(q) || (f.uri || '').toLowerCase().includes(q);
    });

    list.sort((a, b) => {
      if (sortBy === 'name') {
        const cmp = (a.name || '').localeCompare(b.name || '');
        return ascending ? cmp : -cmp;
      }
      const sa = a.size || 0;
      const sb = b.size || 0;
      return ascending ? sa - sb : sb - sa;
    });

    return list;
  }, [cachedFiles, query, sortBy, ascending]);

  const { isDarkColorScheme } = useColorScheme();

  const confirmClearAll = () => {
    Alert.alert('确认', '确定要清理所有 FileCache 吗？此操作不可恢复。', [
      { text: '取消', style: 'cancel' },
      {
        text: '清理',
        style: 'destructive',
        onPress: async () => {
          try {
            await FileCache.clearCache();
            toast.success('FileCache 已清理');
            await refresh();
          } catch (e) {
            toast.error('清理失败: ' + e);
          }
        },
      },
    ]);
  };

  return (
    <>
      <Stack.Screen options={{ title: 'FileCache' }} />

      <PageContainer>
        <SafeAreaView edges={['bottom']} className="flex-1">
          <View className="flex-row items-center justify-between border-b px-4 py-3">
            <View>
              <View className="mt-2 flex-row items-center">
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search by name or path"
                  className={
                    isDarkColorScheme
                      ? 'w-64 rounded-md border px-2 py-1 text-sm bg-card border-gray-700 text-white'
                      : 'w-64 rounded-md border px-2 py-1 text-sm bg-white border-gray-200 text-text-primary'
                  }
                  placeholderTextColor={isDarkColorScheme ? '#9CA3AF' : '#6B7280'}
                />
              </View>
            </View>
          </View>
          <View className="flex-row items-center justify-between border-b px-4 py-3">
            <View className="flex-row space-x-2">
              <Button
                onPress={() => {
                  setSortBy(prev => (prev === 'name' ? 'size' : 'name'));
                }}
              >
                <Text>{sortBy === 'name' ? 'Sort: Name' : 'Sort: Size'}</Text>
              </Button>
              <Button
                onPress={() => {
                  setAscending(prev => !prev);
                }}
              >
                <Text>{ascending ? 'Asc' : 'Desc'}</Text>
              </Button>
              <Button onPress={refresh}>
                <Text>Refresh</Text>
              </Button>
              <Button onPress={confirmClearAll}>
                <Text>Clear All</Text>
              </Button>
            </View>
          </View>

          <ScrollView className="p-4">
            {loading && <Text className="my-2">Loading...</Text>}
            {!loading && cachedFiles.length === 0 && <Text className="text-text-secondary">暂无缓存文件</Text>}
            {displayedFiles.map(f => {
              const itemClass = `mb-3 rounded-lg border p-3 ${
                isDarkColorScheme ? 'bg-card border-gray-700' : 'bg-gray-50 border-gray-200'
              }`;
              const uriClass = isDarkColorScheme
                ? 'truncate text-sm text-text-secondary'
                : 'truncate text-sm text-text-secondary';
              const nameClass = isDarkColorScheme
                ? 'truncate font-medium text-white'
                : 'truncate font-medium text-text-primary';

              return (
                <View key={f.name} className={itemClass}>
                  <Text className={nameClass}>{f.name}</Text>
                  <Text className={uriClass}>{f.uri}</Text>
                  <Text className="text-sm text-text-secondary">{((f.size || 0) / 1024).toFixed(1)} KB</Text>
                  <View className="mt-2 flex-row space-x-2">
                    <Button onPress={() => openFile(f.uri)}>
                      <Text>Open</Text>
                    </Button>
                    <Button onPress={() => copyPath(f.uri)}>
                      <Text>Copy Path</Text>
                    </Button>
                    <Button
                      onPress={() => {
                        Alert.alert('删除确认', `确定删除 ${f.name} 吗？`, [
                          { text: '取消', style: 'cancel' },
                          { text: '删除', style: 'destructive', onPress: () => deleteOne(f.uri) },
                        ]);
                      }}
                    >
                      <Text>Delete</Text>
                    </Button>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </PageContainer>
    </>
  );
}
