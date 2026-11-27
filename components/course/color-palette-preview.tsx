import { View } from 'react-native';

import { Text } from '@/components/ui/text';

interface ColorPalettePreviewProps {
  name: string;
  colors: readonly string[];
}

const renderColors = (colors: readonly string[]) =>
  colors.map(color => (
    <View
      key={color}
      className="aspect-square flex-1 rounded-md border border-border"
      style={{ backgroundColor: color }}
    />
  ));

export default function ColorPalettePreview({ name, colors }: ColorPalettePreviewProps) {
  return (
    <View className="gap-2">
      {[colors.slice(0, 10), colors.slice(10, 20)].map((row, index) => (
        <View
          key={index}
          className="flex-row gap-2"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {renderColors(row)}
        </View>
      ))}
      <View className="flex-row items-center gap-2">
        <View className="flex-1 flex-row items-center gap-2">
          <Text className="min-w-0 flex-1 text-lg font-medium" numberOfLines={1}>
            {name}
          </Text>
        </View>
        <View
          className="flex-1 flex-row gap-2"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {renderColors(colors.slice(20))}
        </View>
      </View>
    </View>
  );
}
