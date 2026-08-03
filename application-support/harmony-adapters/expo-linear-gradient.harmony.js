'use strict';

const React = require('react');
const HarmonyLinearGradientModule = require('react-native-linear-gradient');
const { cssInterop } = require('nativewind');

const HarmonyLinearGradient =
  HarmonyLinearGradientModule.default ?? HarmonyLinearGradientModule.LinearGradient ?? HarmonyLinearGradientModule;

class LinearGradient extends React.Component {
  render() {
    const { colors, locations, start, end, dither: _dither, ...props } = this.props;
    let resolvedLocations = locations;

    if (locations && colors.length !== locations.length) {
      resolvedLocations = locations.slice(0, colors.length);
      if (locations.length > colors.length) {
        // react-native-linear-gradient emits the same warning for a short
        // locations array. Warn here only when slicing makes the arrays equal,
        // so callers still receive the Expo warning exactly once.
        console.warn('LinearGradient colors and locations props should be arrays of the same length');
      }
    }

    return React.createElement(HarmonyLinearGradient, {
      ...props,
      colors,
      locations: resolvedLocations,
      start: normalizePoint(start),
      end: normalizePoint(end),
    });
  }
}

function normalizePoint(point) {
  if (!point) {
    return undefined;
  }

  if (Array.isArray(point) && point.length !== 2) {
    console.warn('start and end props for LinearGradient must be of the format [x,y] or {x, y}');
    return undefined;
  }

  return Array.isArray(point) ? { x: point[0], y: point[1] } : point;
}

cssInterop(LinearGradient, { className: 'style' });

module.exports = { LinearGradient };
