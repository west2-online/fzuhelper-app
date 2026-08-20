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

  React.useEffect(() => {
    NativeStatusBar.setBarStyle(barStyle, animated);
  }, [animated, barStyle]);

  React.useEffect(() => {
    if (hidden !== undefined) {
      NativeStatusBar.setHidden(hidden, hideTransitionAnimation === 'none' ? undefined : hideTransitionAnimation);
    }
  }, [hidden, hideTransitionAnimation]);

  // Mounting React Native's StatusBar component also syncs Android-only
  // background/translucent properties. RNOH already renders the status bar as
  // translucent and logs those updates as unsupported, so use only the two
  // supported imperative operations above.
  return null;
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
