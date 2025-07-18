import React from 'react';
import { Modal, ModalProps, View } from 'react-native';

// Due to an issue on reanimated with newArchEnabled, we need to wrap Modal with a View.
// https://github.com/software-mansion/react-native-reanimated/issues/6659#issuecomment-2704931585
const ModalFix: React.FC<ModalProps> = ({ children, ...modalProps }) => {
  return (
    <View>
      <Modal {...modalProps}>{children}</Modal>
    </View>
  );
};

export default ModalFix;
