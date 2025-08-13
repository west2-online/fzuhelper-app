import NoNetImage from '@/assets/images/multistateview/no_network.png';
import { memo } from 'react';
import { Image, Pressable } from 'react-native';

const ErrorView = ({ refresh }: { refresh?: () => void }) => {
  return (
    <Pressable className="flex-1 items-center justify-center" onPress={refresh}>
      <Image className="w-2/3 flex-1" source={NoNetImage} resizeMode="contain" />
    </Pressable>
  );
};

export default memo(ErrorView);
