import { View } from 'react-native';
import { Circle } from 'react-native-animated-spinkit';

import { cn } from '@/lib/utils';

interface LoadingProps {
  className?: string;
}

const Loading: React.FC<LoadingProps> = ({ className }) => (
  <View className={cn('flex-1 items-center justify-center', className)}>
    <Circle size={72} color="#1089FF" />
  </View>
);

export default Loading;
