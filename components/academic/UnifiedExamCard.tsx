import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import React from 'react';
import { View } from 'react-native';

import type { JwchAcademicUnifiedExamResponse_UnifiedExamData as UnifiedExamData } from '@/api/backend';

interface UnifiedExamProps {
  item: UnifiedExamData;
}

export const UnifiedExamCard: React.FC<UnifiedExamProps> = ({ item }) => (
  <Card className="mb-1 mt-1 flex-row justify-between p-2">
    <View className="flex-1">
      <Text className="text-lg font-bold">{item.name}</Text>
      <Text className="text-text-secondary text-sm">{item.term}</Text>
    </View>
    <View className="flex-row items-center">
      <Text className="text-3xl">{item.score}</Text>
    </View>
  </Card>
);
