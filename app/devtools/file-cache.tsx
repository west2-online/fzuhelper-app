import PageContainer from '@/components/page-container';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import * as FileCache from '@/utils/file-cache';
import { Stack } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

const formatSize = (bytes?: number) => {
  if (!bytes) return '0 KB';
  return `${(bytes / 1024).toFixed(1)} KB`;
};

const formatDateTime = (ms?: number | null) => {
  if (!ms) return '无';
  return new Date(ms).toLocaleString();
};

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

  const refresh = async () => {
    setLoading(true);
    try {
      const files = await FileCache.listCachedFiles(true);
      const enriched = (files || []).map((f: any) => {
        const meta = f.__meta ?? null;
        const cachedAt = meta && typeof meta.cachedAt === 'number' ? meta.cachedAt : null;
        const maxAge = meta && typeof meta.maxAgeMs === 'number' ? meta.maxAgeMs : null;
        const expiresAt = cachedAt && maxAge ? cachedAt + maxAge : null;
        return { ...f, __meta: meta, expiresAt };
      });
      setCachedFiles(enriched);
    } catch (e) {
      toast.error('刷新缓存失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const deleteOne = async (uri: string) => {
    setLoading(true);
    try {
      await FileCache.deleteCachedFile(uri);
      toast.success('删除成功');
      await refresh();
    } catch (e) {
      toast.error('删除失败');
    } finally {
      setLoading(false);
    }
  };

  const openOne = async (uri: string) => {
    try {
      const ok = await FileCache.openFile(uri);
      if (!ok) {
        // fallback to share
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri);
        } else {
          toast.info('打开/分享功能在此设备不可用');
        }
      }
    } catch (e) {
      toast.error('打开文件失败');
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <SimpleRow item={item} onDelete={deleteOne} onOpen={openOne} loading={loading} />
  );

  return (
    <PageContainer>
      <Stack.Screen options={{ title: '文件缓存管理' }} />
      <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
        <View style={styles.toolbar}>
          <Button onPress={refresh} disabled={loading}>
            <Text>刷新</Text>
          </Button>
          <Button
            onPress={async () => {
              if (loading) return;
              setLoading(true);
              try {
                const r = await FileCache.cleanupExpired();
                toast.success(`清理完成, 删除 ${r.deleted || 0} 个文件`);
                await refresh();
              } catch (e) {
                toast.error('清理失败');
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
                await FileCache.clearCache();
                toast.success('清空全部完成');
                await refresh();
              } catch (e) {
                toast.error('清空全部失败');
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
