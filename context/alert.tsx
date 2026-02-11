import AlertModal from '@/components/alert-modal';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { AlertButton } from 'react-native';

interface AlertOptions {
  cancelable?: boolean;
  onDismiss?: () => void;
}

interface AlertContextType {
  showAlert: (title: string, message?: string, buttons?: AlertButton[], options?: AlertOptions) => void;
}

const AlertContext = createContext<AlertContextType | null>(null);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

declare global {
  // eslint-disable-next-line no-var
  var showAlert: (title: string, message?: string, buttons?: AlertButton[], options?: AlertOptions) => void;
}

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [buttons, setButtons] = useState<AlertButton[]>([]);
  const [options, setOptions] = useState<AlertOptions>({});

  const showAlert = (
    alertTitle: string,
    alertMessage?: string,
    alertButtons?: AlertButton[],
    alertOptions?: AlertOptions,
  ) => {
    setTitle(alertTitle);
    setMessage(alertMessage || '');
    setButtons(alertButtons || []);
    setOptions(alertOptions || {});
    setVisible(true);
  };

  useEffect(() => {
    global.showAlert = showAlert;
  }, []);

  const handleClose = () => {
    setVisible(false);
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <AlertModal
        visible={visible}
        title={title}
        message={message}
        buttons={buttons}
        cancelable={options.cancelable}
        onDismiss={options.onDismiss}
        onClose={handleClose}
      />
    </AlertContext.Provider>
  );
}
