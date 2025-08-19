import { cn } from '@/lib/utils';
import { memo } from 'react';
import { View } from 'react-native';
import Loading from '../loading';
import StateViewProps from './state-view-props';

const LoadingView = ({ className, style }: StateViewProps) => {
  return (
    <View className={cn('flex-1 items-center justify-center', className)} style={style}>
      <Loading />
    </View>
  );
};

export default memo(LoadingView);
