import { memo, useEffect, useState } from 'react';
import { View, type ViewProps } from 'react-native';

import { hasCustomBackground } from '@/lib/appearance';
import { cn } from '@/lib/utils';

const HeaderContainer: React.FC<React.PropsWithChildren<ViewProps>> = ({ children, className, ...props }) => {
  const [customBackground, setCustomBackground] = useState(false);

  useEffect(() => {
    const checkBackground = async () => {
      const result = await hasCustomBackground();
      setCustomBackground(result);
    };
    checkBackground();
  }, []);

  return (
    <View
      className={cn('flex flex-none flex-row items-center', className, customBackground ? '' : 'bg-card')}
      {...props}
    >
      {children}
    </View>
  );
};

export default memo(HeaderContainer);
