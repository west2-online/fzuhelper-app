import { memo } from 'react';
import { View } from 'react-native';
import Loading from '../loading';

const LoadingView = () => {
  return (
    <View className="flex-1 items-center justify-center">
      <Loading />
    </View>
  );
};

export default memo(LoadingView);
