'use strict';

const React = require('react');
const { DeviceEventEmitter, Dimensions, TurboModuleRegistry, View } = require('react-native');

const windowFrame = Dimensions.get('window');
const screenFrame = Dimensions.get('screen');
const initialWindowSafeAreaInsets = TurboModuleRegistry.getEnforcing('SafeAreaTurboModule').getInitialInsets();
let currentInsets = initialWindowSafeAreaInsets;

// RNOH prepares these insets before starting JS and updates them when system
// bars, cutouts or window orientation change.
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

function NativeSafeAreaProvider({ onInsetsChange, onLayout, ...props }) {
  const viewRef = React.useRef(null);
  const publishMetrics = React.useCallback(() => {
    viewRef.current?.measureInWindow((x, y, width, height) => {
      if (width <= 0 || height <= 0) return;
      const window = Dimensions.get('window');
      onInsetsChange?.({
        nativeEvent: {
          frame: { x, y, width, height },
          insets: {
            top: Math.max(currentInsets.top - y, 0),
            right: Math.max(currentInsets.right - Math.max(window.width - x - width, 0), 0),
            bottom: Math.max(currentInsets.bottom - Math.max(window.height - y - height, 0), 0),
            left: Math.max(currentInsets.left - x, 0),
          },
        },
      });
    });
  }, [onInsetsChange]);

  React.useLayoutEffect(() => {
    const insetsSubscription = DeviceEventEmitter.addListener('SAFE_AREA_INSETS_CHANGE', insets => {
      currentInsets = insets;
      publishMetrics();
    });
    const dimensionsSubscription = Dimensions.addEventListener('change', publishMetrics);
    publishMetrics();
    return () => {
      insetsSubscription.remove();
      dimensionsSubscription.remove();
    };
  }, [publishMetrics]);

  return React.createElement(View, {
    ...props,
    ref: viewRef,
    collapsable: false,
    onLayout(event) {
      onLayout?.(event);
      publishMetrics();
    },
  });
}

module.exports = {
  NativeSafeAreaProvider,
  initialWindowMetrics,
  initialWindowSafeAreaInsets,
};
