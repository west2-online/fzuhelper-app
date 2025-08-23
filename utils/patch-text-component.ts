import { createTransformProps } from 'react-fast-hoc';
import { Platform, StyleSheet, Text } from 'react-native';

export default () => {
  if (Platform.OS !== 'android') {
    return;
  }

  const styles = StyleSheet.create({
    font: { fontFamily: 'Roboto' },
  });

  const transform = createTransformProps(
    props => ({
      textBreakStrategy: 'simple',
      numberOfLines: 0,
      ...props,
      style: [styles.font, props.style],
    }),
    {
      namePrefix: 'Reset.',
      mimicToNewComponent: false,
    },
  );

  Object.assign(Text, transform(Text));

  console.log('Patch text component complete');
};
