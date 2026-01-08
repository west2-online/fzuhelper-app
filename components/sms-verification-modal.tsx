import { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';

import FloatModal from '@/components/ui/float-modal';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';

interface SmsVerificationModalProps {
  visible: boolean;
  phone: string;
  tip: string;
  onClose: () => void;
  onConfirm: (code: string) => void;
  onSendSms: () => Promise<void>;
}

// 手机号脱敏处理
function maskPhoneNumber(phone: string): string {
  if (phone.length !== 11) {
    return phone; // 如果不是11位，直接返回
  }
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}

/**
 * 短信验证码输入模态框
 */
export default function SmsVerificationModal({
  visible,
  phone,
  tip,
  onClose,
  onConfirm,
  onSendSms,
}: SmsVerificationModalProps) {
  const [verificationCode, setVerificationCode] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [sendError, setSendError] = useState('');

  const handleSendSms = async () => {
    if (countdown > 0 || isSending) {
      return;
    }

    setIsSending(true);
    setSendError('');
    try {
      await onSendSms();
      // 发送成功，开始120秒倒计时
      setCountdown(120);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      setSendError(error?.data || '发送失败，请重试');
    } finally {
      setIsSending(false);
    }
  };

  const handleConfirm = () => {
    if (!verificationCode.trim()) {
      return;
    }
    onConfirm(verificationCode);
    setVerificationCode(''); // 清空输入
    setCountdown(0); // 重置倒计时
    setSendError('');
  };

  const handleClose = () => {
    setVerificationCode(''); // 清空输入
    setCountdown(0); // 重置倒计时
    setSendError('');
    onClose();
  };

  const maskedPhone = maskPhoneNumber(phone);

  return (
    <FloatModal visible={visible} title="短信验证" onClose={handleClose} onConfirm={handleConfirm}>
      <View className="gap-4">
        <Text className="text-center text-sm text-text-secondary">{tip}</Text>
        <Text className="text-center text-base">
          验证码将发送至: <Text className="font-semibold text-primary">{maskedPhone}</Text>
        </Text>

        {/* 验证码输入框和发送按钮 */}
        <View className="flex-row gap-2">
          <Input
            value={verificationCode}
            onChangeText={setVerificationCode}
            placeholder="请输入6位验证码"
            keyboardType="number-pad"
            maxLength={6}
            className="flex-1 px-3 py-2 text-center text-lg"
          />
          <TouchableOpacity
            onPress={handleSendSms}
            disabled={countdown > 0 || isSending}
            className={`items-center justify-center rounded-lg px-4 py-2 ${
              countdown > 0 || isSending ? 'bg-gray-400' : 'bg-primary'
            }`}
            activeOpacity={0.7}
          >
            <Text className="text-sm font-semibold text-white">
              {isSending ? '发送中' : countdown > 0 ? `${countdown}s` : '发送'}
            </Text>
          </TouchableOpacity>
        </View>

        {sendError ? <Text className="text-center text-sm text-red-500">{sendError}</Text> : null}
      </View>
    </FloatModal>
  );
}
