import { cssInterop } from 'nativewind';
import { createElement, forwardRef } from 'react';
import type { TextProps } from 'react-native';

let patched = false;

export default function patchTextComponent() {
  // Use the actual CommonJS exports, not a copied ES module namespace.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactNative: typeof import('react-native') = require('react-native');
  if (ReactNative.Platform.OS !== 'android' || patched) {
    return;
  }

  const { Text, StyleSheet } = ReactNative;
  const styles = StyleSheet.create({
    font: { fontFamily: 'Roboto' },
  });

  const PatchedText = forwardRef<import('react-native').Text, TextProps>((props, ref) =>
    createElement(Text, {
      textBreakStrategy: 'simple',
      numberOfLines: 0,
      ...props,
      style: [styles.font, props.style],
      ref,
    }),
  );
  PatchedText.displayName = 'Reset.Text';

  // RN 0.85 exports a function; copying properties cannot replace its body.
  // Replace the getter so subsequent consumers receive the wrapper.
  Object.defineProperty(ReactNative, 'Text', {
    configurable: true,
    enumerable: true,
    get: () => PatchedText,
  });
  // NativeWind may already have registered the original Text before the layout loads.
  cssInterop(PatchedText, { className: 'style' });
  patched = true;
}

patchTextComponent();
