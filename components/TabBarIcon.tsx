// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/

import Ionicons from '@react-native-vector-icons/ionicons';
import { type ComponentProps } from 'react';

export function TabBarIcon({ style, ...rest }: ComponentProps<typeof Ionicons>) {
  return <Ionicons size={26} style={style} {...rest} />;
}
