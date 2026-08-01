'use strict';

const React = require('react');
const { View } = require('react-native');
const harmonySafeAreaContext = require('@react-native-ohos/react-native-safe-area-context');
const {
  initialWindowMetrics,
  initialWindowSafeAreaInsets,
} = require('./react-native-safe-area-context-initial-window.harmony');

/**
 * The current Harmony SafeAreaView native component can receive a 0x0 window
 * during the first route mount and keep its children collapsed even after the
 * RN surface has a real size. The provider and hooks remain useful, but the
 * per-screen native view is unsafe during cold start. A regular View preserves
 * the caller's layout while the root provider supplies conservative insets.
 */
const SafeAreaView = React.forwardRef(function HarmonySafeAreaView({ edges: _edges, ...props }, ref) {
  return React.createElement(View, { ...props, ref });
});

module.exports = {
  ...harmonySafeAreaContext,
  initialWindowMetrics,
  initialWindowSafeAreaInsets,
  SafeAreaView,
};
