import PageContainer from '@/components/page-container';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Clipboard from '@react-native-clipboard/clipboard';
import { Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
// eslint-disable-next-line no-restricted-imports
import { Alert, Button, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const MAX_LENGTH = 50; // 设置最大长度

export default function HomePage() {
  const [storageItems, setStorageItems] = useState<{ key: string; value: string | null; expanded: boolean }[]>([]);
  const [editingKey, setEditingKey] = useState<string | null>(null); // 当前正在修改的 Key
  const [editingValue, setEditingValue] = useState<string | null>(null); // 当前正在修改的 Value
  const [isModalVisible, setModalVisible] = useState(false); // 控制模态框显示
  const [isAdding, setIsAdding] = useState(false); // 区分新增和编辑模式
  const [inputHeight, setInputHeight] = useState(40); // 初始高度

  useEffect(() => {
    const fetchStorageItems = async () => {
      try {
        const keys = await AsyncStorage.getAllKeys();
        const items = await AsyncStorage.multiGet(keys);
        const formattedItems = items.map(([key, value]) => ({
          key,
          value,
          expanded: false, // 新增的属性，用于控制展开状态
        }));
        setStorageItems(formattedItems);
      } catch (error) {
        console.error('Error fetching storage items:', error);
      }
    };

    fetchStorageItems();
  }, []);

  // 切换展开状态
  const toggleExpand = (index: number) => {
    setStorageItems(prevItems =>
      prevItems.map((item, idx) => {
        if (idx === index) {
          return { ...item, expanded: !item.expanded }; // 切换展开状态
        }
        return { ...item, expanded: false }; // 其他项折叠
      }),
    );
  };

  // 添加 Item
  const addItem = useCallback(async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
      setStorageItems(prevItems => [...prevItems, { key, value, expanded: false }]);
    } catch (error) {
      console.error('Error adding item:', error);
      Alert.alert('新增失败', '无法添加该项，请稍后重试');
    }
  }, []);

  // 修改 Item
  const editItem = useCallback(async (key: string, newValue: string) => {
    try {
      await AsyncStorage.setItem(key, newValue);
      setStorageItems(prevItems => prevItems.map(item => (item.key === key ? { ...item, value: newValue } : item)));
    } catch (error) {
      console.error('Error editing item:', error);
      Alert.alert('修改失败', '无法修改该项，请稍后重试');
    }
  }, []);

  // 清除全部 Item
  const clearAll = useCallback(async () => {
    Alert.alert('确认清空', '确定要清空所有键值对吗？', [
      {
        text: '取消',
        style: 'cancel',
      },
      {
        text: '清空',
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.clear(); // 清空 AsyncStorage
            setStorageItems([]); // 清空状态
          } catch (error) {
            console.error('Error clearing storage:', error);
            Alert.alert('清空失败', '无法清空键值对，请稍后重试');
          }
        },
      },
    ]);
  }, []);

  // 删除特定 Item
  const deleteItem = useCallback(async (key: string) => {
    Alert.alert('确认删除', `确定要删除键 "${key}" 吗？`, [
      {
        text: '取消',
        style: 'cancel',
      },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.removeItem(key);
            setStorageItems(prevItems => prevItems.filter(item => item.key !== key));
          } catch (error) {
            console.error('Error deleting item:', error);
            Alert.alert('删除失败', '无法删除该项，请稍后重试');
          }
        },
      },
    ]);
  }, []);

  // 复制指定 Item 的 KV 对
  const copyItem = (key: string, value: string | null) => {
    Clipboard.setString(`${key}: ${value}`);
    Alert.alert('复制成功', `键 { ${key} } 及其值已复制到剪贴板`);
  };

  const openModal = (key: string | null = null, value: string | null = null, adding = false) => {
    setEditingKey(key);
    setEditingValue(value);
    setIsAdding(adding);
    setModalVisible(true);
  };

  const closeModal = () => {
    setEditingValue(null);
    setModalVisible(false);
  };

  const handleSave = () => {
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
  };

  // Modal 负责新增和编辑操作
  const renderEditModal = () => (
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
  );

  const renderItem = ({
    item,
    index,
  }: {
    item: { key: string; value: string | null; expanded: boolean };
    index: number;
  }) => {
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
            </View>
          )}
          <Text style={styles.valueText} className="text-text-primary">
            {displayValue}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <PageContainer>
      <Stack.Screen options={{ title: 'AsyncStorage Manager', headerTransparent: true }} />
      <View style={styles.container} className="flex-1">
        <View style={styles.headerButtons}>
          <Button title="新增" onPress={() => openModal(null, null, true)} />
          <Button title="清空" onPress={clearAll} color="red" />
        </View>
        <FlatList
          data={storageItems.sort((a, b) => a.key.localeCompare(b.key))}
          keyExtractor={item => item.key}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
        {renderEditModal()}
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
