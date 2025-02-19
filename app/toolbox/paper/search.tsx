import { Paper, PaperType } from '@/components/PaperList';
import { ThemedView } from '@/components/ThemedView';
import { PAPER_SEARCH_HISTORY_KEY } from '@/lib/constants';
import { FolderIcon, getFileIcon, guessFileType } from '@/lib/filetype';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, UnknownOutputParams, useLocalSearchParams, useRouter } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { FlatList, Image, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface SearchPageParam extends UnknownOutputParams {
  currentPath: string;
  currentPapers: string;
}

export default function SearchPage() {
  const { currentPath, currentPapers } = useLocalSearchParams<SearchPageParam>();
  const router = useRouter();
  const [parsedPapers, setParsedPapers] = useState<Paper[]>([]);

  useEffect(() => {
    if (currentPapers) {
      setParsedPapers(JSON.parse(currentPapers));
    }
  }, [currentPapers]);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredPapers, setFilteredPapers] = useState<Paper[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  useEffect(() => {
    loadSearchHistory();
  }, []);

  const loadSearchHistory = async () => {
    const history = await AsyncStorage.getItem(PAPER_SEARCH_HISTORY_KEY);
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  };

  const saveSearchHistory = async (query: string) => {
    if (!query || searchHistory.includes(query)) return;
    const updatedHistory = [query, ...searchHistory.slice(0, 9)];
    setSearchHistory(updatedHistory);
    await AsyncStorage.setItem(PAPER_SEARCH_HISTORY_KEY, JSON.stringify(updatedHistory));
  };

  const clearSearchHistory = async () => {
    await AsyncStorage.removeItem(PAPER_SEARCH_HISTORY_KEY);
    setSearchHistory([]);
  };

  useEffect(() => {
    if (searchQuery) {
      setFilteredPapers(parsedPapers.filter(paper => paper.name.toLowerCase().includes(searchQuery.toLowerCase())));
    } else {
      setFilteredPapers([]);
    }
  }, [searchQuery, parsedPapers]);

  const handlePressItem = (item: Paper) => {
    const path = currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`;
    if (item.type === PaperType.FOLDER) {
      router.push({ pathname: '/toolbox/paper', params: { path: path } });
    } else {
      router.push({ pathname: '/toolbox/paper/file-preview', params: { filepath: path } });
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: '搜索' }} />
      <ThemedView className="flex-1">
        <View className="border-b border-gray-300 p-4">
          <TextInput
            className="h-12 rounded bg-gray-200 px-3"
            placeholder="搜索"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => saveSearchHistory(searchQuery)}
          />
        </View>
        {searchQuery ? (
          <FlatList
            data={filteredPapers}
            keyExtractor={item => item.name}
            renderItem={({ item }) => (
              <TouchableOpacity
                className="flex-row items-center border-b border-gray-200 p-3"
                onPress={() => handlePressItem(item)}
              >
                <Image
                  source={item.type === PaperType.FOLDER ? FolderIcon : getFileIcon(guessFileType(item.name))}
                  className="mr-2 h-6 w-6"
                  resizeMode="contain"
                />
                <Text>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        ) : (
          <View className="p-4">
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="font-bold">搜索历史</Text>
              <TouchableOpacity onPress={clearSearchHistory}>
                <Trash2 size={20} color="gray" />
              </TouchableOpacity>
            </View>
            {searchHistory.length > 0 ? (
              searchHistory.map((query, index) => (
                <TouchableOpacity
                  key={index}
                  className="border-b border-gray-200 p-2"
                  onPress={() => setSearchQuery(query)}
                >
                  <Text>{query}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text className="text-gray-500">无搜索历史</Text>
            )}
          </View>
        )}
      </ThemedView>
    </>
  );
}
