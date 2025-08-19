import EmptyImage from '@/assets/images/multistateview/empty.png';
import { cn } from '@/lib/utils';
import { memo } from 'react';
import { Image, Pressable } from 'react-native';
import StateViewProps from './state-view-props';

const EmptyView = ({ className, style, refresh }: StateViewProps & { refresh?: () => void }) => {
  return (
    <Pressable className={cn('flex-1 items-center justify-center', className)} style={style} onPress={refresh}>
      <Image className="w-2/3 flex-1" source={EmptyImage} resizeMode="contain" />
    </Pressable>
  );
};

export default memo(EmptyView);
