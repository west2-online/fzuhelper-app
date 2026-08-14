'use strict';

const React = require('react');
const { Keyboard, KeyboardAvoidingView, ScrollView, View } = require('react-native');

/**
 * The published Harmony keyboard-controller port targets an older
 * Reanimated/RN line and eagerly initializes its animated provider when the
 * package is imported. A failure there makes the package's entire CommonJS
 * export undefined and prevents Expo Router from mounting the root layout.
 *
 * Keep the APIs used by this app functional with React Native primitives. The
 * only lost behavior is keyboard-following animation; forms remain scrollable
 * and can still dismiss the keyboard.
 */
function KeyboardProvider({ children }) {
  return React.createElement(React.Fragment, null, children);
}

const KeyboardController = {
  dismiss() {
    Keyboard.dismiss();
  },
  setDefaultMode() {},
  setInputMode() {},
  setFocusTo() {},
};

module.exports = {
  KeyboardAwareScrollView: ScrollView,
  KeyboardAvoidingView,
  KeyboardController,
  KeyboardProvider,
  KeyboardStickyView: View,
  OverKeyboardView: View,
};
