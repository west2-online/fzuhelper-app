import { Switch } from '@/components/ui/switch';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

interface SwitchWithLabelProps {
  label: string;
  value: boolean;
  onValueChange: () => void;
  description?: string;
}

const LabelSwitch: React.FC<SwitchWithLabelProps> = ({ label, value, onValueChange, description }) => {
  return (
    <Pressable className="space-y-4" onPress={onValueChange}>
      <View className="flex-row items-center justify-between py-4">
        {/* 左侧文字区域 */}
        <View className="flex-1 pr-4">
          <Text className="text-lg text-text-primary">{label}</Text>
          {description && <Text className="mt-1 text-sm text-text-secondary">{description}</Text>}
        </View>
        {/* 右侧 Switch 区域 */}
        <View>
          <Switch checked={value} onCheckedChange={onValueChange} />
        </View>
      </View>
    </Pressable>
  );
};

export default LabelSwitch;
