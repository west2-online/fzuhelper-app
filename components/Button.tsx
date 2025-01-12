import { Pressable, Text, type PressableProps } from 'react-native';

import cn from '@/utils/cn';
import safeChildren from '@/utils/safe-children';

export interface ButtonProps extends PressableProps {
  className?: string;
  textClassName?: string;
}

const Button: React.FC<React.PropsWithChildren<ButtonProps>> = ({ className, textClassName, children, ...props }) => (
  <Pressable className={cn('flex items-center bg-black px-4 py-2', className)} {...props}>
    {safeChildren(children, p => (
      <Text className={cn('text-white', textClassName)} {...p} />
    ))}
  </Pressable>
);

Button.displayName = 'Button';

export default Button;
