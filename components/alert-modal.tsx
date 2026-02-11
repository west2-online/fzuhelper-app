import { Text } from '@/components/ui/text';
import { useState } from 'react';
import { AlertButton, Modal, Pressable, View } from 'react-native';

interface AlertModalProps {
  visible: boolean;
  title?: string;
  message?: string;
  buttons?: AlertButton[];
  cancelable?: boolean;
  onDismiss?: () => void;
  onClose: () => void;
}

export default function AlertModal({
  visible,
  title,
  message,
  buttons = [],
  cancelable,
  onDismiss,
  onClose,
}: AlertModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleButtonPress = async (button: AlertButton) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await Promise.resolve(button.onPress?.());
    } finally {
      setIsProcessing(false);
      onClose();
    }
  };

  const handleRequestClose = () => {
    if (cancelable) {
      onDismiss?.();
      onClose();
    }
  };

  if (buttons.length === 0) {
    buttons = [{ text: 'OK' }];
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleRequestClose}>
      <View className="flex-1 items-center justify-center bg-[#00000050]">
        <Pressable className="absolute inset-0" onPress={handleRequestClose} />
        <View className="w-4/5 max-w-md rounded-2xl bg-background p-6 shadow-xl">
          {title && <Text className="mb-2 text-center text-xl font-bold text-primary">{title}</Text>}
          {message && <Text className="mb-4 text-center text-base text-foreground">{message}</Text>}
          <View className="flex-row justify-center space-x-2">
            {buttons.map((button, index) => (
              <Pressable
                key={index}
                onPress={() => handleButtonPress(button)}
                className={`flex-1 items-center justify-center rounded-lg p-3 ${
                  button.style === 'destructive'
                    ? 'bg-destructive'
                    : button.style === 'cancel'
                      ? 'bg-muted'
                      : 'bg-primary'
                }`}
                disabled={isProcessing}
              >
                <Text
                  className={`text-center font-medium ${
                    button.style === 'destructive'
                      ? 'text-destructive-foreground'
                      : button.style === 'cancel'
                        ? 'text-muted-foreground'
                        : 'text-primary-foreground'
                  }`}
                >
                  {button.text || 'OK'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}
