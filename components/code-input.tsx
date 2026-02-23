import { useCallback, useRef } from 'react';
import { Platform, TextInput, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { FRIEND_INVITATION_CODE_LEN } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface CodeInputProps {
  value?: string;
  onChangeText?: (text: string) => void;
  editable?: boolean;
  className?: string;
}

export function CodeInput({ value = '', onChangeText, editable = true, className }: CodeInputProps) {
  const inputRef = useRef<TextInput>(null);

  const handlePress = useCallback(() => {
    if (editable) {
      inputRef.current?.blur();
      inputRef.current?.focus();
    }
  }, [editable]);

  const handleChangeText = useCallback(
    (text: string) => {
      if (onChangeText) {
        // 过滤非字母数字字符，做大写转换
        const filteredText = text
          .replace(/[^a-zA-Z]/g, '')
          .toUpperCase()
          .slice(0, FRIEND_INVITATION_CODE_LEN);
        onChangeText(filteredText);
      }
    },
    [onChangeText],
  );

  return (
    <View className={cn('w-full items-center', className)}>
      <TouchableOpacity activeOpacity={1} onPress={handlePress} className="flex-row gap-2">
        {Array.from({ length: FRIEND_INVITATION_CODE_LEN }).map((_, index) => {
          const char = value[index] || '';
          // 当处于编辑模式，且当前框是下一个待输入的框时，高亮显示（可选）
          // 或者只要有值就高亮
          const isActive = editable && index === value.length;
          const hasValue = !!char;

          return (
            <View
              key={index}
              className={cn(
                'h-14 w-11 items-center justify-center rounded-lg border-2 bg-card',
                isActive ? 'border-primary' : 'border-border',
                hasValue ? 'border-primary' : '',
              )}
            >
              <Text className="text-2xl font-bold text-text-primary">{char}</Text>
            </View>
          );
        })}
      </TouchableOpacity>

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChangeText}
        maxLength={FRIEND_INVITATION_CODE_LEN}
        keyboardType={Platform.OS === 'ios' ? 'ascii-capable' : 'visible-password'}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
        importantForAutofill="no"
        spellCheck={false}
        className="invisible absolute h-0 w-0" // 隐藏输入框
        editable={editable}
        autoFocus={editable}
        caretHidden={true}
      />
    </View>
  );
}
