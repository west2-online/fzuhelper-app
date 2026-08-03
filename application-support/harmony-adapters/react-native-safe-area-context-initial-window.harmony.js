'use strict';

const { Dimensions } = require('react-native');

const windowFrame = Dimensions.get('window');
const screenFrame = Dimensions.get('screen');
const initialWindowSafeAreaInsets = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};

// The RNOH port reads window properties synchronously while EntryAbility's
// window can still be under construction. Start with a safe frame and zero
// insets; RNCSafeAreaProvider will publish the real insets after it mounts.
const initialWindowMetrics = {
  frame: {
    x: 0,
    y: 0,
    // Dimensions can briefly report 0x0 before RNAbility finishes attaching
    // its window. Never publish a zero frame because navigation containers
    // can then cache a zero-height layout for the whole first route.
    width: windowFrame.width || screenFrame.width || 1,
    height: windowFrame.height || screenFrame.height || 1,
  },
  insets: initialWindowSafeAreaInsets,
};

module.exports = {
  initialWindowMetrics,
  initialWindowSafeAreaInsets,
};
