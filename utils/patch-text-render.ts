import React from 'react';
import { Platform, StyleSheet, Text } from 'react-native';

export default () => {
  if (Platform.OS !== 'android') {
    return;
  }

  // @ts-expect-error
  const oldRender = Text.render ?? Text.prototype?.render;
  const style = StyleSheet.create({ font: { fontFamily: 'Roboto' } });
  if (!oldRender) {
    console.error('Text.render or Text.prototype.render is not defined, cannot patch font.');
    return;
  }

  if (Text.prototype?.render) {
    Text.prototype.render = function (...args: any[]) {
      const origin = oldRender.call(this, ...args);
      return React.cloneElement(origin, {
        style: [style.font, origin.props.style],
      });
    };
    // @ts-expect-error
  } else if (Text.render) {
    // @ts-expect-error
    Text.render = function (...args: any[]) {
      const origin = oldRender.call(this, ...args);
      return React.cloneElement(origin, {
        style: [style.font, origin.props.style],
      });
    };
  } else {
    console.error('Text.render or Text.prototype.render is not defined, cannot patch font.');
  }

  console.log('Patch text render complete');
};
