'use strict';

const React = require('react');
const { Appearance, StatusBar: NativeStatusBar, useColorScheme } = require('react-native');

function styleToBarStyle(style = 'auto', colorScheme = Appearance?.getColorScheme() ?? 'light') {
  if (!colorScheme) {
    colorScheme = 'light';
  }

  let resolvedStyle = style;
  if (style === 'auto') {
    resolvedStyle = colorScheme === 'light' ? 'dark' : 'light';
  } else if (style === 'inverted') {
    resolvedStyle = colorScheme === 'light' ? 'light' : 'dark';
  }

  return resolvedStyle === 'light' ? 'light-content' : 'dark-content';
}

function StatusBar({ style, hideTransitionAnimation, animated, hidden }) {
  const colorScheme = useColorScheme();
  const barStyle = React.useMemo(() => styleToBarStyle(style, colorScheme), [style, colorScheme]);

  return React.createElement(NativeStatusBar, {
    animated,
    hidden,
    barStyle,
    showHideTransition: hideTransitionAnimation === 'none' ? undefined : hideTransitionAnimation,
  });
}

StatusBar.setStyle = (style, animated) => {
  NativeStatusBar.setBarStyle(styleToBarStyle(style), animated);
};

const setStatusBarStyle = StatusBar.setStyle;

StatusBar.setHidden = (hidden, animation) => {
  NativeStatusBar.setHidden(hidden, animation);
};

const setStatusBarHidden = StatusBar.setHidden;

module.exports = {
  StatusBar,
  setStatusBarHidden,
  setStatusBarStyle,
};
