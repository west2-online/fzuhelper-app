const dayjsWeekMessage =
  "dayjs 的 'week' / week() 周语义容易与 ISO 周或课程周混淆，请改用明确的业务周计算，或确认后单行 disable。";

const dayjsWeekUnitMethods = [
  'add',
  'subtract',
  'diff',
  'startOf',
  'endOf',
  'isSame',
  'isBefore',
  'isAfter',
  'isSameOrBefore',
  'isSameOrAfter',
  'get',
  'set',
];

const dayjsWeekUnitMethodPattern = dayjsWeekUnitMethods.join('|');

module.exports = [
  {
    selector: `CallExpression[callee.property.name=/^(${dayjsWeekUnitMethodPattern})$/] > Literal[value='week']`,
    message: dayjsWeekMessage,
  },
  {
    selector: `CallExpression[callee.property.name=/^(${dayjsWeekUnitMethodPattern})$/] > TemplateLiteral[quasis.length=1] TemplateElement[value.raw='week']`,
    message: dayjsWeekMessage,
  },
  {
    selector: "CallExpression[callee.property.name='week']",
    message: dayjsWeekMessage,
  },
  {
    selector: "CallExpression[callee.property.value='week']",
    message: dayjsWeekMessage,
  },
  {
    selector: "ImportDeclaration[source.value='dayjs/plugin/weekOfYear']",
    message: dayjsWeekMessage,
  },
];
