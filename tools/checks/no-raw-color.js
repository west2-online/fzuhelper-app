const absoluteColorPattern = String.raw`(^|[^A-Za-z0-9_-])#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})(?![0-9a-fA-F])|(?:[rR][gG][bB][aA]?|[hH][sS][lL][aA]?)\s*\(`;
const absoluteColorMessage =
  '业务 UI 中请勿直接写入 hex/rgb/hsl 颜色值，请改用 Tailwind 语义色或统一色板。';

const noRawColorRule = [
  'warn',
  {
    selector: `Literal[value=/${absoluteColorPattern}/]`,
    message: absoluteColorMessage,
  },
  {
    selector: `TemplateElement[value.raw=/${absoluteColorPattern}/]`,
    message: absoluteColorMessage,
  },
];

module.exports = {
  files: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'context/**/*.{js,jsx,ts,tsx}',
    'hooks/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'utils/**/*.{js,jsx,ts,tsx}',
  ],
  rules: {
    'no-restricted-syntax': noRawColorRule,
  },
};
