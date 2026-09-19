const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const templatePath = path.resolve(
  __dirname,
  '../../../application-support/harmony-template/entry/src/main/ets/turboModules/HarmonySystemTurboModule.ets',
);

test('Harmony sharing converts an Expo file URI into a ShareKit app file URI', () => {
  const source = fs.readFileSync(templatePath, 'utf8');

  assert.match(source, /import \{ fileUri \} from '@kit\.CoreFileKit';/);
  assert.match(source, /uri\.startsWith\('file:\/\/'\)/);
  assert.match(source, /fileUri\.getUriFromPath\(path\)/);
  assert.match(source, /uri:\s*sharingUri/);
});
