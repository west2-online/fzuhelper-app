import { Switch } from '@/components/ui/switch';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

interface SwitchWithLabelProps {
  label: string;
  value: boolean;
  onValueChange: () => void;
}

const LabelSwitch: React.FC<SwitchWithLabelProps> = ({ label, value, onValueChange }) => {
  return (
    <Pressable className="space-y-4" onPress={onValueChange}>
      <View className="flex-row items-center justify-between py-4">
        <Text className="text-text-primary text-lg">{label}</Text>
        <Switch checked={value} onCheckedChange={onValueChange} />
      </View>
    </Pressable>
  );
};

export default LabelSwitch;
