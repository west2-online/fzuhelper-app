import { useCallback } from 'react';
import { FlatList } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

interface WeekSelectorProps {
  currentWeek: number;
  maxWeek: number;
  onWeekSelect: (week: number) => void;
}

const WeekSelector: React.FC<WeekSelectorProps> = ({ currentWeek, maxWeek, onWeekSelect }) => {
  const renderItem = useCallback(
    ({ item }: { item: number }) => (
      <Button onPress={() => onWeekSelect(item)} variant={item === currentWeek ? 'default' : 'outline'}>
        <Text>第 {item} 周</Text>
      </Button>
    ),
    [currentWeek, onWeekSelect],
  );

  return (
    <FlatList
      data={Array.from({ length: maxWeek }, (_, i) => i + 1)}
      renderItem={renderItem}
      keyExtractor={item => item.toString()}
      contentContainerStyle={{ padding: 10 }}
      showsVerticalScrollIndicator={false}
    />
  );
};

export default WeekSelector;
