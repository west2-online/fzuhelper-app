import AsyncStorage from '@react-native-async-storage/async-storage';
import Clipboard from '@react-native-clipboard/clipboard';
import { useNavigation } from 'expo-router';
import { useEffect, useLayoutEffect, useState } from 'react';
import { Alert, Button, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const NAVIGATION_TITLE = 'AsyncStorage List';
const MAX_LENGTH = 50; // 设置最大长度

export default function HomePage() {
  const navigation = useNavigation();
  const [storageItems, setStorageItems] = useState<{ key: string; value: string | null; expanded: boolean }[]>([]);

  useLayoutEffect(() => {
    navigation.setOptions({ title: NAVIGATION_TITLE });
  }, [navigation]);

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

  // 删除函数
  const deleteItem = async (key: string) => {
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
  };

  // 复制函数
  const copyItem = (key: string, value: string | null) => {
    Clipboard.setString(`${key}: ${value}`);
    Alert.alert('复制成功', `键 { ${key} } 及其值已复制到剪贴板`);
  };

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
      <View style={styles.itemContainer}>
        <TouchableOpacity onPress={() => toggleExpand(index)} style={styles.itemTouchable}>
          <Text style={styles.keyText}>{item.key}</Text>
          {item.expanded && (
            <View style={styles.buttonContainer}>
              <Button title="删除" onPress={() => deleteItem(item.key)} color="red" />
              <Button title="复制" onPress={() => copyItem(item.key, item.value)} />
            </View>
          )}
          <Text style={styles.valueText}>{displayValue}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={storageItems}
        keyExtractor={item => item.key}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9f9f9',
  },
  listContent: {
    paddingBottom: 20,
  },
  itemContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    backgroundColor: '#fff',
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
    color: '#333',
  },
  valueText: {
    fontSize: 14,
    color: '#555',
    marginVertical: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
});
