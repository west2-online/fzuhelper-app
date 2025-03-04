import { View, type ViewProps } from 'react-native';

import { cn } from '@/lib/utils';

const HeaderContainer: React.FC<React.PropsWithChildren<ViewProps>> = ({ children, className, ...props }) => (
  <View className={cn('flex flex-none flex-row items-center bg-card shadow ring-opacity-5', className)} {...props}>
    {children}
  </View>
);

export default HeaderContainer;
