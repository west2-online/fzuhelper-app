import { View } from 'react-native';
import { Circle } from 'react-native-animated-spinkit';

import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogContent } from './ui/alert-dialog';
import { Text } from './ui/text';

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
    <AlertDialogContent className="m-2 flex-row items-center">
      <Loading className="flex-none" size={60} />
      {message && <Text className="text-center">{message ?? '加载中...'}</Text>}
    </AlertDialogContent>
  </AlertDialog>
);

export default Loading;
export { LoadingDialog };
