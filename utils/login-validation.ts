import { RefObject } from 'react';
import { ScrollView } from 'react-native';
import { toast } from 'sonner-native';

/**
 * Validates if user has agreed to terms and policies
 * @param isAgree - Whether user has checked the agreement checkbox
 * @param scrollViewRef - Optional ref to scroll view to scroll to end on error
 * @returns true if agreed, false otherwise (shows error toast)
 */
export const validateAgreement = (isAgree: boolean, scrollViewRef?: RefObject<ScrollView>): boolean => {
  if (!isAgree) {
    toast.error('请先阅读并同意服务协议和隐私政策');
    scrollViewRef?.current?.scrollToEnd();
    return false;
  }
  return true;
};

/**
 * Validates if a required field is filled
 * @param value - Field value to validate
 * @param fieldName - Name of the field for error message
 * @returns true if field is filled, false otherwise (shows error toast)
 */
export const validateRequiredField = (value: string, fieldName: string): boolean => {
  if (!value) {
    toast.error(`请输入${fieldName}`);
    return false;
  }
  return true;
};
