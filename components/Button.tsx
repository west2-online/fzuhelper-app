import { Pressable, Text, type PressableProps } from 'react-native';

import { cva, type VariantProps } from 'class-variance-authority';

import cn from '@/utils/cn';
import safeChildren from '@/utils/safe-children';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-black py-2 px-3',
        link: '',
      },
      size: {
        default: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

const textVariants = cva('text-white', {
  variants: {
    variant: {
      default: '',
      link: 'text-primary',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface ButtonProps extends PressableProps, VariantProps<typeof buttonVariants> {
  className?: string;
  textClassName?: string;
}

const Button: React.FC<React.PropsWithChildren<ButtonProps>> = ({
  className,
  textClassName,
  variant,
  size,
  children,
  ...props
}) => (
  <Pressable className={cn(buttonVariants({ variant, size, className }))} {...props}>
    {safeChildren(children, p => (
      <Text className={cn(textVariants({ variant, className: textClassName }))} {...p} />
    ))}
  </Pressable>
);

Button.displayName = 'Button';

export default Button;
