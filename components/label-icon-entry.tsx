import ArrowRightIcon from '@/assets/images/misc/ic_arrow_right.png';
import React from 'react';
import { Image, ImageSourcePropType, Text, TouchableOpacity, View } from 'react-native';
import RedDot from './ui/red-dot';

interface LabelIconEntryProps {
  icon: ImageSourcePropType;
  reddot?: boolean;
  label: string;
  onPress?: () => void;
}

const LabelIconEntry: React.FC<LabelIconEntryProps> = ({ icon, reddot = false, label, onPress }) => {
  return (
    <TouchableOpacity className={'flex-row items-center justify-between py-4'} onPress={onPress}>
      <View className="flex-row items-center space-x-4">
        <Image source={icon} className="h-7 w-7" />
        <Text className="ml-5 text-lg text-text-primary">{label}</Text>
      </View>
      {reddot && <RedDot right={20} top={22} />}
      <Image source={ArrowRightIcon} className="h-5 w-5" />
    </TouchableOpacity>
  );
};

export default LabelIconEntry;
