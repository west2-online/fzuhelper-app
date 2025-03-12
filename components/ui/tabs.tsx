import * as TabsPrimitive from '@rn-primitives/tabs';
import * as React from 'react';
import { cn } from '@/lib/utils';
import { TextClassContext } from '@/components/ui/text';
import { View } from 'react-native';

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<TabsPrimitive.ListRef, TabsPrimitive.ListProps>(
  ({ className, ...props }, ref) => (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        'web:inline-flex items-center justify-center native:px-1.5',
        className
      )}
      {...props}
    />
  )
);
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<TabsPrimitive.TriggerRef, TabsPrimitive.TriggerProps>(
  ({ className, ...props }, ref) => {
    const { value } = TabsPrimitive.useRootContext();
    return (
      <TextClassContext.Provider
        value={cn(
          'text-s native:text-base text-primary web:transition-all',
          value === props.value && 'font-bold'
        )}
      >
        <View className='relative'>
          {/* 主要标签容器 */}
          <TabsPrimitive.Trigger
            ref={ref}
            className={cn(
              'inline-flex items-center justify-center shadow-none web:whitespace-nowrap rounded-t-2xl px-4 min-w-24 py-2 text-sm font-medium web:ring-offset-background web:transition-all web:focus-visible:outline-none web:focus-visible:ring-2 web:focus-visible:ring-ring web:focus-visible:ring-offset-2',
              props.disabled && 'web:pointer-events-none opacity-50',
              props.value === value && 'bg-card',
              className
            )}
            {...props}
          />

          {props.value === value && (
            <>
              {/* 左下角外切圆角 */}
              {/* <View className="absolute bottom-0 -left-4 w-4 h-4 bg-card" /> */}
              {/* <View className="absolute bottom-0 -left-4 w-4 h-4 rounded-br-2xl" /> */}

              {/* 右下角外切圆角 */}
              {/* <View className="absolute bottom-0 -right-4 w-4 h-4 bg-card" /> */}
              {/* <View className="absolute bottom-0 -right-4 w-4 h-4 rounded-bl-2xl" /> */}
            </>
          )}
        </View>
      </TextClassContext.Provider>
    );
  }
);
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<TabsPrimitive.ContentRef, TabsPrimitive.ContentProps>(
  ({ className, ...props }, ref) => (
    <TabsPrimitive.Content
      ref={ref}
      className={cn(
        'web:ring-offset-background web:focus-visible:outline-none web:focus-visible:ring-2 web:focus-visible:ring-ring web:focus-visible:ring-offset-2',
        className
      )}
      {...props}
    />
  )
);
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsContent, TabsList, TabsTrigger };
