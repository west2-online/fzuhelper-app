'use strict';

const React = require('react');
const { View } = require('react-native');

const fallback = React.forwardRef(function ExperimentalScreensFallback(props, ref) {
  return React.createElement(View, { ...props, ref });
});

module.exports = new Proxy(
  { SafeAreaView: fallback, SplitHost: fallback, Stack: fallback, Tabs: fallback },
  {
    get(target, property) {
      return target[property] ?? fallback;
    },
  },
);
