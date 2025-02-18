import { View } from 'react-native';
import { Circle } from 'react-native-animated-spinkit';

const Loading: React.FC = () => {
  return (
    <View className="flex-1 items-center justify-center">
      <Circle size={72} color="#1089FF" />
    </View>
  );
};

export default Loading;
