import AsyncStorage from '@react-native-async-storage/async-storage';
import Clipboard from '@react-native-clipboard/clipboard';
import { Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';

const NAVIGATION_TITLE = 'AsyncStorage List';

export default function HomePage() {
  const [storageItems, setStorageItems] = useState<{ key: string; value: string | null }[]>([]);
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
        }));
        setStorageItems(formattedItems);
      } catch (error) {
        console.error('Error fetching storage items:', error);
      }
    };

    fetchStorageItems();
  }, []);

  // 添加 Item
  const addItem = useCallback(async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
      setStorageItems(prevItems => [...prevItems, { key, value }]);
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
  }, [isAdding, editingKey, editingValue, addItem, editItem, closeModal]);

  const renderItem = ({ item }: { item: { key: string; value: string | null } }) => (
    <Card className="mb-4">
      <Collapsible>
        <CardHeader>
          <CollapsibleTrigger asChild>
            <CardTitle>{item.key}</CardTitle>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent>
            <Text>{item.value}</Text>
          </CardContent>

          <CardFooter>
            <Button onPress={() => deleteItem(item.key)} variant="destructive">
              <Text>删除</Text>
            </Button>
            <Button onPress={() => copyItem(item.key, item.value)}>
              <Text>复制</Text>
            </Button>
            <Button onPress={() => openModal(item.key, item.value)}>
              <Text>修改</Text>
            </Button>
          </CardFooter>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );

  return (
    <>
      <Stack.Screen options={{ title: NAVIGATION_TITLE }} />

      <View className="flex-1 gap-4 bg-muted p-4">
        <View className="flex flex-row justify-between">
          <Button onPress={() => openModal(null, null, true)}>
            <Text>新增</Text>
          </Button>
          <Button onPress={clearAll} variant="destructive">
            <Text>清空</Text>
          </Button>
        </View>

        <FlatList data={storageItems} keyExtractor={item => item.key} renderItem={renderItem} />

        <Dialog open={isModalVisible} onOpenChange={setModalVisible}>
          <DialogContent className="w-[90vw]">
            <DialogHeader>
              <DialogTitle>{isAdding ? '新增' : `修改 [${editingKey}]`}</DialogTitle>
            </DialogHeader>

            {isAdding && (
              <Input
                className="mb-4 border p-3"
                value={editingKey || ''}
                onChangeText={setEditingKey}
                placeholder="Key"
              />
            )}
            {/* Value 输入框，支持多行，动态调整高度 */}
            <Input
              className="mb-4 border p-3"
              style={{ height: inputHeight }} // 动态设置高度
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

            <DialogFooter>
              <Button onPress={closeModal} variant="secondary">
                <Text>取消</Text>
              </Button>

              <Button onPress={handleSave}>
                <Text>保存</Text>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </View>
    </>
  );
}
