const { forbiddenList } = require('./forbidden-rule.js');

module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    plugins: [
      function forbidImports() {
        return {
          visitor: {
            ImportDeclaration(path) {
              forbiddenList.forEach(rule => {
                if (path.node.source.value === rule.source) {
                  if (
                    rule.names.length === 0 ||
                    path.node.specifiers.some(spec => spec.imported && rule.names.includes(spec.imported.name))
                  ) {
                    throw path.buildCodeFrameError(rule.message);
                  }
                }
              });
            },
          },
        };
      },
    ],
  };
};
