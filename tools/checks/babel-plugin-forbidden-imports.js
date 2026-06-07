const forbiddenRule = require('./forbidden-imports');
const path = require('path');

module.exports = function ({ types: t }) {
  return {
    visitor: {
      ImportDeclaration(pathNode, state) {
        const filename = state.file.opts.filename || '';
        const importSource = pathNode.node.source.value;

        if (
          filename.includes(`${path.sep}node_modules${path.sep}`) ||
          filename.includes('/node_modules/') ||
          filename.includes('\\node_modules\\')
        ) {
          return;
        }

        const leadingComments = pathNode.node.leadingComments || [];
        const hasESLintDisable = leadingComments.some(comment =>
          /eslint-disable(-next-line)?\s+no-restricted-imports/.test(comment.value),
        );
        if (hasESLintDisable) return;

        for (const rule of forbiddenRule) {
          if (importSource !== rule.source) continue;

          if (
            rule.allowIn?.some(allowPath => {
              const fileAbs = path.resolve(filename);
              const allowAbs = path.resolve(allowPath);
              const relative = path.relative(allowAbs, fileAbs);

              return (
                fileAbs === allowAbs || (relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative))
              );
            })
          ) {
            continue;
          }

          const banned = pathNode.node.specifiers.some(spec => {
            if (t.isImportSpecifier(spec)) {
              return rule.names.includes(spec.imported.name);
            }
            if (t.isImportDefaultSpecifier(spec)) {
              return rule.names.includes('default');
            }
            if (t.isImportNamespaceSpecifier(spec)) {
              return rule.names.includes('*');
            }
            return false;
          });

          if (banned) {
            throw pathNode.buildCodeFrameError(rule.message);
          }
        }
      },
    },
  };
};
