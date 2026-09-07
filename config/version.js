const { execFileSync } = require('node:child_process');
const path = require('node:path');
const { version } = require('../package.json');

// Keep the same version during CNG verification in a temporary project copy.
let commitCount = 0;
try {
  const output =
    process.env.GIT_COMMIT_COUNT ??
    execFileSync('git', ['rev-list', '--count', 'HEAD'], {
      cwd: path.resolve(__dirname, '..'),
      encoding: 'utf8',
    }).trim();
  const count = Number.parseInt(output, 10);
  if (Number.isSafeInteger(count) && count >= 0) commitCount = count;
} catch (error) {
  console.error('无法获取 git commit 次数，将使用默认值 0:', error);
}
// Carry the computed count into CNG's temporary checkout, which has no .git directory.
process.env.GIT_COMMIT_COUNT = String(commitCount);
const buildNumber = version.replaceAll('.', '') + String(commitCount).padStart(3, '0');
module.exports = { version, buildNumber, versionCode: Number.parseInt(buildNumber, 10) };
