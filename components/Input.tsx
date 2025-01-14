import { TextInput, type TextInputProps } from 'react-native';

import cn from '@/utils/cn';

interface InputProps extends TextInputProps {
  className?: string;
}

const Input: React.FC<InputProps> = ({ className, ...otherProps }) => {
  return <TextInput className={cn('border p-4', className)} {...otherProps} />;
};

export default Input;
