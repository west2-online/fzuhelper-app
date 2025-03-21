import React from 'react';
import { View } from 'react-native';

interface RedDotProps {
  right: number;
  top: number;
}
const RedDot: React.FC<RedDotProps> = ({ right, top }) => {

  return (
    // eslint-disable-next-line react-native/no-inline-styles
    <View style={{
      width: 8,
      height: 8,
      backgroundColor: 'red',
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'absolute',
      right: right,
      top: top,
    }} />
  );
};

export default RedDot;