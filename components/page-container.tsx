import { View, type ViewProps } from 'react-native';

import { cn } from '@/lib/utils';

export type ThemedViewProps = ViewProps;

export default function PageContainer({ className, ...otherProps }: ThemedViewProps) {
  return <View className={cn('flex-1 bg-muted', className)} {...otherProps} />;
}
