import { View } from 'react-native';
import { Circle } from 'react-native-animated-spinkit';

import { AlertDialog, AlertDialogContent } from '@/components/ui/alert-dialog';
import { Text } from '@/components/ui/text';

import { cn } from '@/lib/utils';
import { memo } from 'react';

interface LoadingProps {
  className?: string;
  size?: number;
}

const Loading: React.FC<LoadingProps> = ({ className, size }) => (
  <View className={cn('flex-1 items-center justify-center', className)}>
    <Circle size={size ?? 72} color="#1089FF" />
  </View>
);

interface LoadingDialogProps {
  open: boolean;
  message?: string;
}

const LoadingDialog: React.FC<LoadingDialogProps> = ({ open, message }) => (
  <AlertDialog open={open}>
    <AlertDialogContent className={cn('m-2 flex-row items-center', message ? 'w-[80vw]' : '')}>
      <Loading className="flex-none" size={60} />
      {message && <Text className="ml-2 text-center">{message}</Text>}
    </AlertDialogContent>
  </AlertDialog>
);

export default memo(Loading);
export { LoadingDialog };
