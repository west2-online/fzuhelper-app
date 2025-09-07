/* eslint-disable no-alert */
import { Alert, AlertButton, AlertStatic, Platform } from 'react-native';

class WebAlert implements Pick<AlertStatic, 'alert'> {
  public alert(title: string, message?: string, buttons?: AlertButton[]): void {
    if (buttons === undefined || buttons.length === 0) {
      window.alert([title, message].filter(Boolean).join('\n'));
      return;
    }

    const confirm = buttons.find(({ style }) => style !== 'cancel');
    const cancel = buttons.find(({ style }) => style === 'cancel');
    const buttonLabels = buttons.map((button) => button.text || '');

    const result = window.confirm([title, message].filter(Boolean).join('\n'));

    if (result) {
      confirm?.onPress?.();
      return;
    }

    cancel?.onPress?.();
  }
}

// export const Alert = new WebAlert();

if (Platform.OS === 'web') {
  Alert.alert = new WebAlert().alert;
}
