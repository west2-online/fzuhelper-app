import { createTransformProps } from 'react-fast-hoc';
import * as RN from 'react-native';

export default () => {
  if (RN.Platform.OS !== 'android') {
    return;
  }

  const styles = RN.StyleSheet.create({
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

  Object.assign(RN.Text, transform(RN.Text));

  console.log('Patch text component complete');
};
