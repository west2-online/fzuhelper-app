import IcCancel from '@/assets/images/misc/ic_cancel.svg';
import IcConfirm from '@/assets/images/misc/ic_confirm.svg';
import { Text } from '@/components/ui/text';
import { Modal, Pressable, View } from 'react-native';
import {useState} from 'react';

interface FloatModalProps {
  visible: boolean;
  transparent?: boolean;
  title?: string;
  onClose: () => void;
  onConfirm?: () => void;
  children: React.ReactNode;
  className?: string;
  contentContainerClassName?: string;
}

/**
 * 悬浮提示框
 */
export default function FloatModal({
  visible,
  transparent = true,
  title,
  onClose,
  onConfirm,
  children,
  className = '',
  contentContainerClassName = '',
}: FloatModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  return (
    <Modal
      visible={visible}
      transparent={transparent}
      navigationBarTranslucent
      statusBarTranslucent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* 这里用 flex-1 确保整个 Modal 的背景可点击 */}
      <View className="flex-1 items-center justify-center bg-[#00000050]">
        {/* 透明背景可点击关闭 */}
        <Pressable className="absolute inset-0" onPress={onClose} />

        {/* 弹出窗口 */}
        <View className={`w-4/5 max-w-md rounded-2xl bg-background p-6 shadow-xl ${className}`}>
          {/* 标题 */}
          {title && <Text className="mb-4 text-center text-xl font-bold text-primary">{title}</Text>}

          {/* 内容 */}
          <View className={`${contentContainerClassName}`}>{children}</View>

          {/* 按钮区域 */}
          {isProcessing ? (<Text className='text-center flex'>正在处理中...</Text>
          ) : (<View className="mt-6 flex-row justify-between">
            <Pressable onPress={onClose} className="flex-1 items-center p-2">
              <IcCancel className="h-6 w-6" />
            </Pressable>
            {onConfirm && (
              <Pressable onPress={async ()=> {
                setIsProcessing(true);
                try {
                  await Promise.resolve(onConfirm());
                } finally {
                  setIsProcessing(false);
                }
              }} className="flex-1 items-center p-2" disabled={isProcessing}>
                <IcConfirm className="h-6 w-6" />
              </Pressable>
            )}
          </View>)}
        </View>
      </View>
    </Modal>
  );
}
