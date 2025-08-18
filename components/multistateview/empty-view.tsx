import EmptyImage from '@/assets/images/multistateview/empty.png';
import { cn } from '@/lib/utils';
import { memo } from 'react';
import { Image, View } from 'react-native';
import StateViewProps from './state-view-props';

const EmptyView = ({ className }: StateViewProps) => {
  return (
    <View className={cn('flex-1 items-center justify-center', className)}>
      <Image className="w-2/3 flex-1" source={EmptyImage} resizeMode="contain" />
    </View>
  );
};

export default memo(EmptyView);
