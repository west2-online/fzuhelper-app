const forbiddenRule = require('./forbidden-rule');
const path = require('path');

module.exports = function ({ types: t }) {
  return {
    visitor: {
      ImportDeclaration(pathNode, state) {
        const filename = state.file.opts.filename || '';
        const importSource = pathNode.node.source.value;

        // 跳过 node_modules
        if (
          filename.includes(`${path.sep}node_modules${path.sep}`) ||
          filename.includes('/node_modules/') ||
          filename.includes('\\node_modules\\')
        ) {
          return;
        }

        // 检查 ESLint 注释是否禁用本规则
        const leadingComments = pathNode.node.leadingComments || [];
        const hasESLintDisable = leadingComments.some(comment =>
          /eslint-disable(-next-line)?\s+no-restricted-imports/.test(comment.value),
        );
        if (hasESLintDisable) return; // 放行

        for (const rule of forbiddenRule) {
          // 模块名不匹配，跳过
          if (importSource !== rule.source) continue;

          // 白名单路径匹配，跳过
          if (
            rule.allowIn?.some(allowPath => {
              const fileAbs = path.resolve(filename);
              const allowAbs = path.resolve(allowPath);
              const relative = path.relative(allowAbs, fileAbs);

              // 文件名完全匹配，或在允许目录内
              return (
                fileAbs === allowAbs || (relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative))
              );
            })
          ) {
            continue;
          }

          // 检查是否导入了禁止的名称
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
