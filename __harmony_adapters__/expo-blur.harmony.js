'use strict';

const React = require('react');
const { StyleSheet, View } = require('react-native');
const { BlurView: HarmonyBlurView } = require('@react-native-ohos/blur');

const HARMONY_BLUR_TYPES = {
  default: 'regular',
  extraLight: 'xlight',
  light: 'light',
  dark: 'dark',
  regular: 'regular',
  prominent: 'prominent',
  systemUltraThinMaterial: 'ultraThinMaterial',
  systemThinMaterial: 'thinMaterial',
  systemMaterial: 'material',
  systemThickMaterial: 'thickMaterial',
  systemChromeMaterial: 'chromeMaterial',
  systemUltraThinMaterialLight: 'ultraThinMaterialLight',
  systemThinMaterialLight: 'thinMaterialLight',
  systemMaterialLight: 'materialLight',
  systemThickMaterialLight: 'thickMaterialLight',
  systemChromeMaterialLight: 'chromeMaterialLight',
  systemUltraThinMaterialDark: 'ultraThinMaterialDark',
  systemThinMaterialDark: 'thinMaterialDark',
  systemMaterialDark: 'materialDark',
  systemThickMaterialDark: 'thickMaterialDark',
  systemChromeMaterialDark: 'chromeMaterialDark',
};

class BlurView extends React.Component {
  blurViewRef = React.createRef();

  getAnimatableRef() {
    return this.blurViewRef.current;
  }

  componentDidMount() {
    if (this.props.experimentalBlurMethod != null) {
      console.warn('The `experimentalBlurMethod` prop has been depracated. Please use the `blurMethod` prop instead.');
    }
  }

  render() {
    const {
      tint = 'default',
      intensity = 50,
      blurReductionFactor: _blurReductionFactor,
      blurTarget: _blurTarget,
      blurMethod: _blurMethod,
      experimentalBlurMethod: _experimentalBlurMethod,
      style,
      children,
      ...props
    } = this.props;

    return React.createElement(
      View,
      {
        ...props,
        style: [styles.container, style],
      },
      React.createElement(HarmonyBlurView, {
        ref: this.blurViewRef,
        blurType: HARMONY_BLUR_TYPES[tint] ?? HARMONY_BLUR_TYPES.default,
        blurAmount: Math.round(intensity),
        style: StyleSheet.absoluteFill,
      }),
      children,
    );
  }
}

const BlurTargetView = React.forwardRef(function BlurTargetView(props, ref) {
  return React.createElement(View, { ...props, ref });
});

const styles = StyleSheet.create({
  container: { backgroundColor: 'transparent' },
});

module.exports = { BlurTargetView, BlurView };
