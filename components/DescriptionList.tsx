import { View, type ViewProps } from 'react-native';

import { cn } from '@/lib/utils';
import safeChildren from '@/utils/safe-children';

interface DescriptionListProps extends ViewProps {
  className?: string;
}

const DescriptionList: React.FC<React.PropsWithChildren<DescriptionListProps>> = ({
  className,
  children,
  ...props
}) => (
  <View className={cn('flex flex-col gap-2', className)} {...props}>
    {children}
  </View>
);

DescriptionList.displayName = 'DescriptionList';

interface DescriptionListRowProps extends ViewProps {
  className?: string;
}

const DescriptionListRow: React.FC<React.PropsWithChildren<DescriptionListRowProps>> = ({
  className,
  children,
  ...props
}) => (
  <View className={cn('flex flex-row items-center justify-between gap-3 px-3', className)} {...props}>
    {children}
  </View>
);

DescriptionListRow.displayName = 'DescriptionListRow';

interface DescriptionListTermProps extends ViewProps {
  className?: string;
}

const DescriptionListTerm: React.FC<React.PropsWithChildren<DescriptionListTermProps>> = ({
  className,
  children,
  ...props
}) => (
  <View className={cn('flex-shrink-0', className)} {...props}>
    {safeChildren(children)}
  </View>
);

DescriptionListTerm.displayName = 'DescriptionListTerm';

interface DescriptionListDescriptionProps extends ViewProps {
  className?: string;
}

const DescriptionListDescription: React.FC<React.PropsWithChildren<DescriptionListDescriptionProps>> = ({
  className,
  children,
  ...props
}) => (
  <View className={cn('flex-shrink', className)} {...props}>
    {safeChildren(children)}
  </View>
);

DescriptionListDescription.displayName = 'DescriptionListDescription';

export { DescriptionList, DescriptionListDescription, DescriptionListRow, DescriptionListTerm };
