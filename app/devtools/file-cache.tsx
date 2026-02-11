import PageContainer from '@/components/page-container';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import fileCache from '@/utils/file-cache';
import { Stack } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

// 工具函数：格式化文件大小和时间
const formatSize = (bytes?: number) => {
  if (!bytes) return '0 KB';
  return `${(bytes / 1024).toFixed(1)} KB`;
};
const formatDateTime = (ms?: number | null) => {
  if (!ms) return '无';
  return new Date(ms).toLocaleString();
};

// 单行文件项组件
const SimpleRow = ({
  item,
  onDelete,
  onOpen,
  loading,
}: {
  item: any;
  onDelete: (uri: string) => void;
  onOpen: (uri: string) => void;
  loading: boolean;
}) => (
  <TouchableOpacity style={styles.itemRow} onPress={() => onOpen(item.uri)} activeOpacity={0.7}>
    <View style={styles.rowLeft}>
      <Text style={styles.nameText}>{item.name}</Text>
      <Text style={styles.metaText}>
        {formatSize(item.size || 0)} • 失效: {item.expiresAt ? formatDateTime(item.expiresAt) : '无'}
      </Text>
      <Text style={styles.pathText}>{item.uri}</Text>
    </View>
    <View style={styles.rowRight}>
      <Button onPress={() => onDelete(item.uri)} disabled={loading}>
        <Text>删除</Text>
      </Button>
    </View>
  </TouchableOpacity>
);

export default function FileCachePage() {
  const [cachedFiles, setCachedFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  // 刷新缓存列表
  const refresh = async () => {
    setLoading(true);
    try {
      const files = await fileCache.listCachedFiles(true);
      const enriched = (files || []).map((f: any) => {
        const meta = f.__meta ?? null;
        const cachedAt = meta && typeof meta.cachedAt === 'number' ? meta.cachedAt : null;
        const maxAge = meta && typeof meta.maxAgeMs === 'number' ? meta.maxAgeMs : null;
        const expiresAt = cachedAt && maxAge ? cachedAt + maxAge : null;
        return { ...f, __meta: meta, expiresAt };
      });
      setCachedFiles(enriched);
    } catch (e) {
      toast.error('刷新缓存失败' + e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  // 删除单个缓存文件
  const deleteOne = async (uri: string) => {
    setLoading(true);
    try {
      await fileCache.deleteCachedFile(uri);
      toast.success('删除成功');
      await refresh();
    } catch (e) {
      toast.error('删除失败' + e);
    } finally {
      setLoading(false);
    }
  };

  // 打开单个缓存文件
  const openOne = async (uri: string) => {
    try {
      if (!(await fileCache.openFile(uri))) {
        await Sharing.shareAsync(uri);
      }
    } catch (e) {
      toast.error('打开文件失败' + e);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <SimpleRow item={item} onDelete={deleteOne} onOpen={openOne} loading={loading} />
  );

  return (
    <PageContainer>
      <Stack.Screen options={{ title: '文件缓存管理' }} />
      <SafeAreaView edges={['bottom']} style={styles.container}>
        <View style={styles.toolbar}>
          <Button onPress={refresh} disabled={loading}>
            <Text>刷新</Text>
          </Button>
          <Button
            onPress={async () => {
              if (loading) return;
              setLoading(true);
              try {
                const r = await fileCache.cleanupExpired();
                toast.success(`清理完成, 删除 ${r.deleted || 0} 个文件`);
                await refresh();
              } catch (e) {
                toast.error('清理失败' + e);
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
          >
            <Text>清理已过期</Text>
          </Button>
          <Button
            onPress={async () => {
              if (loading) return;
              setLoading(true);
              try {
                await fileCache.deleteCachedFile(fileCache.CACHE_DIR);
                toast.success('清空全部完成');
                await refresh();
              } catch (e) {
                toast.error('清空全部失败' + e);
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
          >
            <Text>清空全部</Text>
          </Button>
        </View>

        <FlatList
          data={cachedFiles}
          keyExtractor={item => item.name || item.uri}
          refreshing={loading}
          onRefresh={refresh}
          renderItem={renderItem}
        />
      </SafeAreaView>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 8,
  },
  itemRow: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
    alignItems: 'center',
  },
  rowLeft: {
    flex: 1,
  },
  rowRight: {
    marginLeft: 8,
  },
  nameText: {
    fontSize: 15,
    fontWeight: '600',
  },
  metaText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  pathText: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
});
