import { useState } from 'react';
import { View } from 'react-native';

import FloatModal from '@/components/ui/float-modal';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';

interface SmsVerificationModalProps {
  visible: boolean;
  phone: string;
  tip: string;
  onClose: () => void;
  onConfirm: (code: string) => void;
}

/**
 * 短信验证码输入模态框
 */
export default function SmsVerificationModal({ visible, phone, tip, onClose, onConfirm }: SmsVerificationModalProps) {
  const [verificationCode, setVerificationCode] = useState('');

  const handleConfirm = () => {
    if (!verificationCode.trim()) {
      return;
    }
    onConfirm(verificationCode);
    setVerificationCode(''); // 清空输入
  };

  const handleClose = () => {
    setVerificationCode(''); // 清空输入
    onClose();
  };

  return (
    <FloatModal visible={visible} title="短信验证" onClose={handleClose} onConfirm={handleConfirm}>
      <View className="gap-4">
        <Text className="text-center text-sm text-text-secondary">{tip}</Text>
        <Text className="text-center text-base">
          验证码已发送至: <Text className="font-semibold text-primary">{phone}</Text>
        </Text>
        <Input
          value={verificationCode}
          onChangeText={setVerificationCode}
          placeholder="请输入6位验证码"
          keyboardType="number-pad"
          maxLength={6}
          className="w-full px-3 py-2 text-center text-lg"
        />
      </View>
    </FloatModal>
  );
}
