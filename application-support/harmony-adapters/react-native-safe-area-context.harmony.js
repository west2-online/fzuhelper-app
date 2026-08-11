'use strict';

const React = require('react');
const { StyleSheet, View } = require('react-native');
const harmonySafeAreaContext = require('@react-native-ohos/react-native-safe-area-context');
const {
  initialWindowMetrics,
  initialWindowSafeAreaInsets,
} = require('./react-native-safe-area-context-initial-window.harmony');

/**
 * The current Harmony SafeAreaView native component can receive a 0x0 window
 * during the first route mount and keep its children collapsed even after the
 * RN surface has a real size. Keep the regular View fallback, but apply the
 * insets published by SafeAreaProvider in JS so screens still avoid the system
 * bars after the provider receives the real window metrics.
 */
const defaultEdges = {
  top: 'additive',
  right: 'additive',
  bottom: 'additive',
  left: 'additive',
};

function normalizeEdges(edges) {
  if (edges == null) {
    return defaultEdges;
  }

  if (Array.isArray(edges)) {
    return edges.reduce((result, edge) => {
      result[edge] = 'additive';
      return result;
    }, {});
  }

  return edges;
}

function getBaseEdgeValue(style, mode, edge) {
  const isVertical = edge === 'top' || edge === 'bottom';
  const edgeSuffix = edge[0].toUpperCase() + edge.slice(1);
  const logicalEdge = edge === 'top' ? 'BlockStart' : edge === 'bottom' ? 'BlockEnd' : undefined;

  return (
    style[`${mode}${edgeSuffix}`] ??
    (logicalEdge ? style[`${mode}${logicalEdge}`] : undefined) ??
    (isVertical ? (style[`${mode}Vertical`] ?? style[`${mode}Block`]) : style[`${mode}Horizontal`]) ??
    style[mode] ??
    0
  );
}

function resolveEdgeValue(edgeMode, inset, baseValue) {
  if (edgeMode === 'off' || edgeMode == null) {
    return undefined;
  }

  // Percentages and "auto" cannot be combined with an absolute safe-area
  // inset. They are not useful for an enabled safe-area edge, so prefer the
  // inset and keep layout safe.
  const base = typeof baseValue === 'number' ? baseValue : 0;
  return edgeMode === 'maximum' ? Math.max(base, inset) : base + inset;
}

const SafeAreaView = React.forwardRef(function HarmonySafeAreaView({ edges, mode = 'padding', style, ...props }, ref) {
  const insets = harmonySafeAreaContext.useSafeAreaInsets();
  const edgeModes = normalizeEdges(edges);
  const flatStyle = StyleSheet.flatten(style) || {};
  const insetStyle = {};

  for (const edge of ['top', 'right', 'bottom', 'left']) {
    const value = resolveEdgeValue(edgeModes[edge], insets[edge], getBaseEdgeValue(flatStyle, mode, edge));
    if (value !== undefined) {
      const edgeSuffix = edge[0].toUpperCase() + edge.slice(1);
      insetStyle[`${mode}${edgeSuffix}`] = value;
    }
  }

  return React.createElement(View, { ...props, ref, style: [style, insetStyle] });
});

SafeAreaView.displayName = 'HarmonySafeAreaView';

module.exports = {
  ...harmonySafeAreaContext,
  initialWindowMetrics,
  initialWindowSafeAreaInsets,
  SafeAreaView,
};
