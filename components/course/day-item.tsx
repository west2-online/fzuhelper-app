import { cva, type VariantProps } from 'class-variance-authority';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';

import { cn } from '@/lib/utils';

const dayItemTextVariants = cva('text-sm', {
  variants: {
    variant: {
      default: 'text-foreground',
      muted: 'text-muted-foreground',
      highlight: 'text-primary',
    },
  },
});

const dayItemText2Variants = cva(
  'flex h-8 w-8 items-center justify-center text-center align-middle text-xl font-medium',
  {
    variants: {
      variant: {
        default: 'text-foreground',
        muted: 'text-foreground',
        highlight: 'text-primary',
      },
    },
  },
);

const bottomBorderVariants = cva('h-[3px] w-9 rounded-full', {
  variants: {
    variant: {
      default: 'bg-transparent',
      muted: 'bg-transparent',
      highlight: 'bg-primary',
    },
  },
});

type DayItemProps = {
  day: string; // 星期几，例如 "一", "二"
  date: number; // 日期，例如 10, 11
} & VariantProps<typeof dayItemTextVariants>;

// 这个组件用于渲染一个日期的单元格，比如星期一到星期日
const DayItem: React.FC<DayItemProps> = ({ day, date, variant }) => (
  <View className="flex flex-grow flex-col items-center pt-2">
    <Text className={cn(dayItemTextVariants({ variant }))}>{day}</Text>
    <Text className={cn('mt-1', dayItemText2Variants({ variant }))}>{date}</Text>

    {/* 当前日期指示器（底部横线） */}
    <View className={cn('mt-1', bottomBorderVariants({ variant }))} />
  </View>
);

export default DayItem;
