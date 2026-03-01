import { Switch } from '@/components/ui/switch';
import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

interface SwitchWithLabelProps {
  label: string;
  value: boolean;
  onValueChange: () => void;
  description?: string;
  disabled?: boolean;
  loading?: boolean;
}

const LabelSwitch: React.FC<SwitchWithLabelProps> = ({
  label,
  value,
  onValueChange,
  description,
  disabled = false,
  loading = false,
}) => {
  return (
    <View className="flex-row items-center justify-between py-4">
      {/* 左侧文字区域 */}
      <TouchableOpacity className="flex-1" onPress={onValueChange} activeOpacity={0.7} disabled={loading || disabled}>
        <Text className={`text-lg ${loading || disabled ? 'text-text-secondary' : 'text-text-primary'}`}>{label}</Text>
        {description && <Text className="mt-1 text-sm text-text-secondary">{description}</Text>}
      </TouchableOpacity>
      {/* 右侧 Switch 或 Loading 区域 */}
      <View className="ml-2">
        {loading ? (
          <ActivityIndicator size="small" />
        ) : (
          <Switch checked={value} onCheckedChange={onValueChange} disabled={disabled} />
        )}
      </View>
    </View>
  );
};

export default LabelSwitch;
