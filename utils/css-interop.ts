import { cssInterop } from 'nativewind';
import { Image, Platform } from 'react-native';
import { ScrollView, TextInput } from 'react-native-gesture-handler';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Animated from 'react-native-reanimated';

// 鸿蒙web需要处理
if (Platform.OS === 'web') {
  cssInterop(TextInput, {
    className: {
      target: 'style',
    },
    placeholderClassName: {
      target: false,
      nativeStyleToProp: {
        color: 'placeholderTextColor',
      },
    },
  });
  cssInterop(Image, {
    className: {
      target: 'style',
    },
  });
  cssInterop(KeyboardAwareScrollView, {
    className: {
      target: 'style',
    },
  });
  cssInterop(ScrollView, {
    className: {
      target: 'style',
    },
    contentContainerClassName: {
      target: 'contentContainerStyle',
    },
  });
  cssInterop(Animated.View, {
    className: {
      target: 'style',
    },
  });
}
