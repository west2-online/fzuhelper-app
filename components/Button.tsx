import { Children } from 'react';
import { Pressable, PressableProps, Text } from 'react-native';

import cn from '@/utils/cn';

export interface ButtonProps extends PressableProps {
  className?: string;
  textClassName?: string;
}

const Button: React.FC<React.PropsWithChildren<ButtonProps>> = ({ className, textClassName, children, ...props }) => (
  <Pressable className={cn('flex items-center bg-black px-4 py-2', className)} {...props}>
    {Children.map(children, child =>
      typeof child === 'string' ? <Text className={cn('text-white', textClassName)}>{child}</Text> : child,
    )}
  </Pressable>
);

Button.displayName = 'Button';

export default Button;
