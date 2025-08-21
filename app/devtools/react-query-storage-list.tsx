import PageContainer from '@/components/page-container';
import Clipboard from '@react-native-clipboard/clipboard';
import { useQueryClient } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
// eslint-disable-next-line no-restricted-imports
import { Alert, Button, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const MAX_LENGTH = 50; // 设置最大长度

export default function ReactQueryStorageList() {
  const [storageItems, setStorageItems] = useState<{ key: string; value: string | null; expanded: boolean }[]>([]);
  const [editingKey, setEditingKey] = useState<string | null>(null); // 当前正在修改的 Key
  const [editingValue, setEditingValue] = useState<string | null>(null); // 当前正在修改的 Value
  const [isModalVisible, setModalVisible] = useState(false); // 控制模态框显示
  const [isAdding, setIsAdding] = useState(false); // 区分新增和编辑模式
  const [inputHeight, setInputHeight] = useState(40); // 初始高度

  const queryClient = useQueryClient();

  // 提取公共的数据获取逻辑
  const fetchStorageItems = useCallback(() => {
    try {
      const formattedItems: { key: string; value: string | null; expanded: boolean }[] = [];

      queryClient
        .getQueryCache()
        .findAll()
        .forEach(query => {
          const { queryKey, state } = query;
          const keyString = JSON.stringify(queryKey);
          let valueString: string;

          try {
            if (state.data !== undefined) {
              valueString = JSON.stringify(state.data, null, 2);
            } else if (state.error) {
              valueString = `Error: ${JSON.stringify(state.error, null, 2)}`;
            } else {
              valueString = `Status: ${state.status}`;
            }
          } catch (error) {
            console.error('Error serializing query data:', error);
            valueString = `[Unable to serialize]: ${String(state.data)}`;
          }

          formattedItems.push({
            key: keyString,
            value: valueString,
            expanded: false,
          });
        });

      setStorageItems(formattedItems);
    } catch (error) {
      console.error('Error fetching query cache items:', error);
    }
  }, [queryClient]);

  useEffect(() => {
    fetchStorageItems();
  }, [fetchStorageItems]);

  // 切换展开状态
  const toggleExpand = useCallback((index: number) => {
    setStorageItems(prevItems =>
      prevItems.map((item, idx) => {
        if (idx === index) {
          return { ...item, expanded: !item.expanded }; // 切换展开状态
        }
        return { ...item, expanded: false }; // 其他项折叠
      }),
    );
  }, []);

  // 添加 Query Cache Item
  const addItem = useCallback(
    async (key: string, value: string) => {
      try {
        let queryKey: any;
        let data: any;

        try {
          queryKey = JSON.parse(key);
        } catch {
          Alert.alert('错误', 'Query Key 必须是有效的 JSON 格式');
          return;
        }

        try {
          data = JSON.parse(value);
        } catch {
          // 如果不是 JSON，就当作字符串处理
          data = value;
        }

        queryClient.setQueryData(queryKey, data);

        // 刷新列表
        fetchStorageItems();
      } catch (error) {
        console.error('Error adding query cache item:', error);
        Alert.alert('新增失败', '无法添加该项，请稍后重试');
      }
    },
    [queryClient, fetchStorageItems],
  );

  // 修改 Query Cache Item
  const editItem = useCallback(
    async (key: string, newValue: string) => {
      try {
        let queryKey: any;
        let data: any;

        try {
          queryKey = JSON.parse(key);
        } catch {
          Alert.alert('错误', 'Query Key 格式错误');
          return;
        }

        try {
          data = JSON.parse(newValue);
        } catch {
          data = newValue;
        }

        queryClient.setQueryData(queryKey, data);

        setStorageItems(prevItems => prevItems.map(item => (item.key === key ? { ...item, value: newValue } : item)));
      } catch (error) {
        console.error('Error editing query cache item:', error);
        Alert.alert('修改失败', '无法修改该项，请稍后重试');
      }
    },
    [queryClient],
  );

  // 清除全部 Query Cache
  const clearAll = useCallback(async () => {
    Alert.alert('确认清空', '确定要清空所有查询缓存吗？', [
      {
        text: '取消',
        style: 'cancel',
      },
      {
        text: '清空',
        style: 'destructive',
        onPress: async () => {
          try {
            queryClient.clear();
            setStorageItems([]);
          } catch (error) {
            console.error('Error clearing query cache:', error);
            Alert.alert('清空失败', '无法清空查询缓存，请稍后重试');
          }
        },
      },
    ]);
  }, [queryClient]);

  // 删除特定 Query Cache Item
  const deleteItem = useCallback(
    async (key: string) => {
      Alert.alert('确认删除', `确定要删除查询 "${key}" 吗？`, [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              const queryKey = JSON.parse(key);
              queryClient.removeQueries({ queryKey });
              setStorageItems(prevItems => prevItems.filter(item => item.key !== key));
            } catch (error) {
              console.error('Error deleting query cache item:', error);
              Alert.alert('删除失败', '无法删除该项，请稍后重试');
            }
          },
        },
      ]);
    },
    [queryClient],
  );

  // 失效特定查询
  const invalidateQuery = useCallback(
    async (key: string) => {
      Alert.alert('确认失效', `确定要失效查询 "${key}" 吗？`, [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '失效',
          style: 'destructive',
          onPress: async () => {
            try {
              const queryKey = JSON.parse(key);
              await queryClient.invalidateQueries({ queryKey });
              Alert.alert('操作成功', '查询已失效，将在下次访问时重新获取数据');
            } catch (error) {
              console.error('Error invalidating query:', error);
              Alert.alert('操作失败', '无法失效该查询，请稍后重试');
            }
          },
        },
      ]);
    },
    [queryClient],
  );

  // 刷新查询列表
  const refreshList = useCallback(() => {
    fetchStorageItems();
  }, [fetchStorageItems]);

  const copyItem = useCallback((key: string, value: string | null) => {
    Clipboard.setString(`${key}: ${value}`);
    Alert.alert('复制成功', `键 { ${key} } 及其值已复制到剪贴板`);
  }, []);

  const openModal = useCallback((key: string | null = null, value: string | null = null, adding = false) => {
    setEditingKey(key);
    setEditingValue(value);
    setIsAdding(adding);
    setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setEditingValue(null);
    setModalVisible(false);
  }, []);

  const handleSave = useCallback(() => {
    if (isAdding) {
      if (!editingKey || !editingValue) {
        Alert.alert('错误', '键和值不能为空');
        return;
      }
      addItem(editingKey, editingValue);
    } else if (editingKey && editingValue !== null) {
      editItem(editingKey, editingValue);
    }
    closeModal();
  }, [addItem, closeModal, editItem, editingKey, editingValue, isAdding]);

  // Modal 负责新增和编辑操作
  const EditModal = useMemo(
    () => (
      <Modal visible={isModalVisible} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={styles.modalContainer} className="bg-background">
          <View style={styles.modalContent} className="bg-card">
            <Text style={styles.modalTitle} className="text-primary">
              {isAdding ? '新增' : '修改 [' + editingKey + ']'}
            </Text>
            {isAdding && (
              <TextInput
                style={styles.input}
                className="text-text-primary"
                value={editingKey || ''}
                onChangeText={setEditingKey}
                placeholder="Key"
              />
            )}
            {/* Value 输入框，支持多行，动态调整高度 */}
            <TextInput
              className="text-text-primary"
              style={[styles.input, { height: inputHeight }]} // 动态设置高度
              value={editingValue || ''}
              onChangeText={setEditingValue}
              placeholder="请输入值"
              multiline
              textAlignVertical="top"
              onContentSizeChange={event => {
                const height = event.nativeEvent.contentSize.height;
                setInputHeight(Math.max(Math.min(height + 20, 400), 40)); // 限制最大高度为 200
              }}
            />
            <View style={styles.modalButtons}>
              <Button title="取消" onPress={closeModal} />
              <Button title="保存" onPress={handleSave} />
            </View>
          </View>
        </View>
      </Modal>
    ),
    [closeModal, editingKey, editingValue, handleSave, inputHeight, isAdding, isModalVisible],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: { key: string; value: string | null; expanded: boolean }; index: number }) => {
      const displayValue =
        item.expanded || !item.value || item.value.length <= MAX_LENGTH
          ? item.value
          : item.value.substring(0, MAX_LENGTH) + '...';

      return (
        <View style={styles.itemContainer} className="bg-card">
          <TouchableOpacity onPress={() => toggleExpand(index)} style={styles.itemTouchable} activeOpacity={0.7}>
            <Text style={styles.keyText} className="text-primary">
              {item.key}
            </Text>
            {item.expanded && (
              <View style={styles.buttonContainer}>
                <Button title="删除" onPress={() => deleteItem(item.key)} color="red" />
                <Button title="复制" onPress={() => copyItem(item.key, item.value)} />
                <Button title="修改" onPress={() => openModal(item.key, item.value)} />
                <Button title="失效" onPress={() => invalidateQuery(item.key)} color="orange" />
              </View>
            )}
            <Text style={styles.valueText} className="text-text-primary">
              {displayValue}
            </Text>
          </TouchableOpacity>
        </View>
      );
    },
    [copyItem, deleteItem, invalidateQuery, openModal, toggleExpand],
  );

  return (
    <PageContainer>
      <Stack.Screen options={{ title: 'Query Cache Manager', headerTransparent: true }} />
      <View style={styles.container} className="flex-1">
        <View style={styles.headerButtons}>
          <Button title="新增" onPress={() => openModal(null, null, true)} />
          <Button title="刷新" onPress={refreshList} />
          <Button title="清空" onPress={clearAll} color="red" />
        </View>
        <FlatList
          data={storageItems.sort((a, b) => a.key.localeCompare(b.key))}
          keyExtractor={item => item.key}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
        {EditModal}
      </View>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  itemContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
  },
  itemTouchable: {
    flex: 1,
  },
  keyText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  valueText: {
    fontSize: 14,
    marginVertical: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
