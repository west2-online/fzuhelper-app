import { memo } from 'react';
import { View, type ViewProps } from 'react-native';

import { hasCustomBackground } from '@/lib/appearance';
import { cn } from '@/lib/utils';

const HeaderContainer: React.FC<React.PropsWithChildren<ViewProps>> = ({ children, className, ...props }) => (
  <View
    className={cn(
      'flex flex-none flex-row items-center ring-opacity-5',
      className,
      hasCustomBackground() ? '' : 'bg-card shadow',
    )}
    {...props}
  >
    {children}
  </View>
);

export default memo(HeaderContainer);
