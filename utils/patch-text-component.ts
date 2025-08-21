import { createTransformProps } from 'react-fast-hoc';
import { Platform, StyleSheet, Text } from 'react-native';
import { getManufacturerSync, getSystemVersion } from 'react-native-device-info';

// 检测文本是否同时包含中文和英文/数字
const hasChineseAndAlphanumeric = (text: string): boolean => {
  const chineseRegex = /[\u4e00-\u9fff]/; // 中文字符
  const alphanumericRegex = /[a-zA-Z0-9]/; // 英文字母和数字

  return chineseRegex.test(text) && alphanumericRegex.test(text);
};

// 递归检查children中是否有符合条件的文本
const shouldAddSpace = (children: any): boolean => {
  if (typeof children === 'string') {
    return hasChineseAndAlphanumeric(children);
  } else if (Array.isArray(children)) {
    return children.some(child => shouldAddSpace(child));
  }
  return false;
};

export default () => {
  if (Platform.OS !== 'android') {
    return;
  }

  // HyperOS2(Android 15) 有文本排版优化选项，默认开启，开启时会引起文本截断。是否开启我们无从得知
  const isHyperOS2 = getManufacturerSync() === 'Xiaomi' && parseInt(getSystemVersion().split('.')[0], 10) >= 15;

  const styles = StyleSheet.create({
    font: { fontFamily: 'Roboto' },
  });

  const transform = createTransformProps(
    props => {
      // 通用 Patch
      let processedProps: any = {
        textBreakStrategy: 'simple',
        numberOfLines: 0,
        ...props,
        style: [styles.font, props.style],
      };

      // 只有在 HyperOS2 设备上，且文本同时包含中文和英文/数字时才添加空格
      if (isHyperOS2 && props.children && shouldAddSpace(props.children)) {
        if (typeof props.children === 'string') {
          processedProps.children = props.children + ' ';
        } else if (Array.isArray(props.children)) {
          processedProps.children = [...props.children, ' '];
        }
      }

      return processedProps;
    },
    {
      namePrefix: 'Reset.',
      mimicToNewComponent: false,
    },
  );

  Object.assign(Text, transform(Text));

  console.log('Patch text component complete');
};
