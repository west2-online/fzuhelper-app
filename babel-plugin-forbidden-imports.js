const forbiddenRule = require('./forbidden-rule');

module.exports = function ({ types: t }) {
  return {
    visitor: {
      ImportDeclaration(pathNode, state) {
        const filename = state.file.opts.filename || '';
        const importSource = pathNode.node.source.value;

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
          if (rule.allowIn?.some(allowPath => filename.includes(allowPath))) {
            return;
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
