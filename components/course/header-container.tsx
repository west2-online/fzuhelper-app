import { memo, useEffect, useState } from 'react';
import { View, type ViewProps } from 'react-native';

import { useTheme } from '@/components/app-theme-provider';
import { cn } from '@/lib/utils';

const HeaderContainer: React.FC<React.PropsWithChildren<ViewProps>> = ({ children, className, ...props }) => {
  const { hasCustomBackground } = useTheme();

  return (
    <View
      className={cn('flex flex-none flex-row items-center', className, hasCustomBackground ? '' : 'bg-card')}
      {...props}
    >
      {children}
    </View>
  );
};

export default memo(HeaderContainer);
