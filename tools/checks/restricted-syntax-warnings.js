const noDayjsWeekSelectors = require('./no-dayjs-week');
const noRawColorSelectors = require('./no-raw-color');

module.exports = {
  'no-restricted-syntax': ['warn', ...noRawColorSelectors, ...noDayjsWeekSelectors],
};
