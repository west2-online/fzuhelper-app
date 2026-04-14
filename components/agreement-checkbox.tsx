import { URL_PRIVACY_POLICY, URL_USER_AGREEMENT } from '@/lib/constants';
import { pushToWebViewNormal } from '@/lib/webview';
import { useFocusEffect } from 'expo-router';
import { forwardRef, useCallback, useImperativeHandle, useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { KeyboardController } from 'react-native-keyboard-controller';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Checkbox } from './ui/checkbox';
import { Text } from './ui/text';

export interface AgreementCheckboxRef {
  checkAgreement: (onAgree: () => void) => void;
  isAgree: boolean;
}

const AgreementCheckbox = forwardRef<AgreementCheckboxRef>((_, ref) => {
  const [isAgree, setIsAgree] = useState(false);
  const [isFocus, setIsFocus] = useState(true);
  const [privacyDialogVisible, setPrivacyDialogVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  useImperativeHandle(ref, () => ({
    checkAgreement: async (onAgree: () => void) => {
      KeyboardController.dismiss();
      if (isAgree) {
        onAgree();
      } else {
        setPendingAction(() => onAgree);
        setPrivacyDialogVisible(true);
      }
    },
    isAgree,
  }));

  useFocusEffect(
    useCallback(() => {
      setIsFocus(true);
      return () => {
        setIsFocus(false);
      };
    }, []),
  );

  // 打开服务协议
  const openUserAgreement = useCallback(() => {
    pushToWebViewNormal(URL_USER_AGREEMENT, '服务协议');
  }, []);

  // 打开隐私政策
  const openPrivacyPolicy = useCallback(() => {
    pushToWebViewNormal(URL_PRIVACY_POLICY, '隐私政策');
  }, []);

  return (
    <>
      {/* 底部协议 */}
      <TouchableOpacity
        activeOpacity={0.7}
        className="mb-4 mt-12 w-full flex-row justify-center py-2"
        onPress={() => setIsAgree(!isAgree)}
      >
        <Checkbox checked={isAgree} onCheckedChange={setIsAgree} />
        <Text className="text-center text-text-secondary">
          {'  '}
          阅读并同意{' '}
          <Text
            className="text-primary"
            onPress={event => {
              event.stopPropagation();
              openUserAgreement();
            }}
          >
            服务协议
          </Text>{' '}
          和{' '}
          <Text
            className="text-primary"
            onPress={event => {
              event.stopPropagation();
              openPrivacyPolicy();
            }}
          >
            隐私政策
          </Text>
        </Text>
      </TouchableOpacity>

      <AlertDialog open={privacyDialogVisible && isFocus}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="mx-auto mb-2">协议与隐私</AlertDialogTitle>
            <AlertDialogDescription>
              <Text>我已阅读并同意 </Text>
              <Text
                className="text-primary"
                onPress={() => {
                  pushToWebViewNormal(URL_USER_AGREEMENT, '服务协议');
                }}
              >
                服务协议
              </Text>
              <Text> 和 </Text>
              <Text
                className="text-primary"
                onPress={() => {
                  pushToWebViewNormal(URL_PRIVACY_POLICY, '隐私政策');
                }}
              >
                隐私政策
              </Text>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row">
            <AlertDialogCancel
              className="flex-1"
              onPress={() => {
                setPrivacyDialogVisible(false);
                setPendingAction(null);
              }}
            >
              <Text>不同意</Text>
            </AlertDialogCancel>
            <AlertDialogAction
              className="flex-1"
              onPress={() => {
                setPrivacyDialogVisible(false);
                setIsAgree(true);
                if (pendingAction) {
                  pendingAction();
                  setPendingAction(null);
                }
              }}
            >
              <Text className="text-white">同意</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});

AgreementCheckbox.displayName = 'AgreementCheckbox';

export default AgreementCheckbox;
