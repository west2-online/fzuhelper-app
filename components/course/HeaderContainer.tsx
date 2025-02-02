import React from 'react';
import { View } from 'react-native';

interface HeaderContainerProps {
  children: React.ReactNode;
}

const HeaderContainer: React.FC<HeaderContainerProps> = ({ children }) => {
  return (
    <View className="flex flex-none flex-row items-center bg-white shadow ring-1 ring-black ring-opacity-5">
      {children}
    </View>
  );
};

export default HeaderContainer;
