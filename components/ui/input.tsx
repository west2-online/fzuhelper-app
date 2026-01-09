import * as React from 'react';
import { cn } from '@/lib/utils';
import { TextInput } from 'react-native-gesture-handler';
import { TextInputProps } from 'react-native';

const Input = React.forwardRef<React.ComponentRef<typeof TextInput>, TextInputProps>(
  ({ className, placeholderClassName, ...props }, ref) => {
    return (
      <TextInput
        ref={ref}
        className={cn(
          'web:flex h-10 native:h-12 web:w-full border-b border-l-0 border-r-0 border-t-0 border-border focus:border-primary px-3 web:py-2 text-base lg:text-sm native:text-lg native:leading-[1.25] text-foreground placeholder:text-text-secondary web:ring-offset-background file:border-0 file:bg-transparent file:font-medium web:outline-none',
          props.editable === false && 'opacity-50 web:cursor-not-allowed',
          className
        )}
        placeholderClassName={cn('text-text-secondary', placeholderClassName)}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export { Input };
