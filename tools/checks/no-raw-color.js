const rawColorMessage =
  '业务 UI 中请勿直接写入 hex/rgb/hsl 或 Tailwind 色阶类（如 bg-gray-100），请改用语义色或统一色板。';

const tailwindColorNames = [
  'slate',
  'gray',
  'zinc',
  'neutral',
  'stone',
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
];

const tailwindColorUtilities = [
  'bg',
  'text',
  'border',
  'ring',
  'divide',
  'outline',
  'fill',
  'stroke',
  'placeholder',
  'decoration',
  'from',
  'via',
  'to',
];

const tailwindColorNamePattern = String.raw`(?:${tailwindColorNames.join('|')})`;
const tailwindColorScalePattern = String.raw`(?:50|100|200|300|400|500|600|700|800|900|950)`;
const tailwindVariantPattern = String.raw`(?:[A-Za-z0-9_-]+:)*`;
const tailwindColorSuffixPattern = String.raw`${tailwindColorNamePattern}-${tailwindColorScalePattern}(?:\/(?:[0-9]{1,3}|\[[^\]]+\]))?`;

const createTailwindColorClassPattern = utility =>
  String.raw`(^|\s)${tailwindVariantPattern}${utility}-${tailwindColorSuffixPattern}(?=\s|$)`;

const createStringLiteralSelectors = pattern => [
  {
    selector: `Literal[value=/${pattern}/]`,
    message: rawColorMessage,
  },
  {
    selector: `TemplateElement[value.raw=/${pattern}/]`,
    message: rawColorMessage,
  },
];

const restrictedColorPatterns = [
  String.raw`(^|[^A-Za-z0-9_-])#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})(?![0-9a-fA-F])`,
  String.raw`(?:[rR][gG][bB][aA]?|[hH][sS][lL][aA]?)\s*\(`,
  ...tailwindColorUtilities.map(createTailwindColorClassPattern),
];

module.exports = restrictedColorPatterns.flatMap(createStringLiteralSelectors);
