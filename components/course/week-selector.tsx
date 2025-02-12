// WeekSelector.tsx

import { AntDesign } from '@expo/vector-icons';
import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface WeekSelectorProps {
  currentWeek: number;
  maxWeek: number;
  onWeekSelect: (week: number) => void;
}

const WeekSelector: React.FC<WeekSelectorProps> = ({ currentWeek, maxWeek, onWeekSelect }) => {
  const renderItem = ({ item }: { item: number }) => (
    <TouchableOpacity
      onPress={() => onWeekSelect(item)}
      style={[styles.itemContainer, item === currentWeek ? styles.selectedItem : styles.unselectedItem]}
    >
      <Text style={styles.itemText}>第 {item} 周</Text>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={Array.from({ length: maxWeek }, (_, i) => i + 1)}
      renderItem={renderItem}
      keyExtractor={item => item.toString()}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    padding: 10,
  },
  itemContainer: {
    padding: 15,
    borderRadius: 10,
    marginVertical: 5,
    elevation: 3, // For Android shadow
    shadowColor: '#000', // For iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center',
  },
  selectedItem: {
    backgroundColor: '#007BFF', // Green for selected
  },
  unselectedItem: {
    backgroundColor: 'white', // White for unselected
  },
  itemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});

export default WeekSelector;
