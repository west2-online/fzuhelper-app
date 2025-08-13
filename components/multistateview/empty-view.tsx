import EmptyImage from '@/assets/images/multistateview/empty.png';
import { memo } from 'react';
import { Image, View } from 'react-native';

const EmptyView = () => {
  return (
    <View className="flex-1 items-center justify-center">
      <Image className="w-2/3 flex-1" source={EmptyImage} resizeMode="contain" />
    </View>
  );
};

export default memo(EmptyView);
