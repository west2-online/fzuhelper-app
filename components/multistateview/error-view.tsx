import NoNetImage from '@/assets/images/multistateview/no_network.png';
import { cn } from '@/lib/utils';
import { memo } from 'react';
import { Image, Pressable } from 'react-native';
import StateViewProps from './state-view-props';

const ErrorView = ({ className, style, refresh }: StateViewProps & { refresh?: () => void }) => {
  return (
    <Pressable className={cn('flex-1 items-center justify-center', className)} style={style} onPress={refresh}>
      <Image className="w-2/3 flex-1" source={NoNetImage} resizeMode="contain" />
    </Pressable>
  );
};

export default memo(ErrorView);
