const businessCodeFiles = require('./business-code-files');
const noDayjsWeekSelectors = require('./no-dayjs-week');
const noRawColorSelectors = require('./no-raw-color');

module.exports = {
  files: businessCodeFiles,
  rules: {
    'no-restricted-syntax': ['warn', ...noRawColorSelectors, ...noDayjsWeekSelectors],
  },
};
