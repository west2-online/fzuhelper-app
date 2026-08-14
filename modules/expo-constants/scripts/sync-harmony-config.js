'use strict';

const { mkdirSync, readFileSync, writeFileSync } = require('node:fs');
const path = require('node:path');
const { getConfig } = require('@expo/config');

function syncHarmonyConstants({ harmonyDir, outputPath, projectDir }) {
  const expoConfig = getConfig(projectDir, {
    isPublicConfig: true,
    skipSDKVersionRequirement: true,
  }).exp;
  const harmonyApp = JSON.parse(readFileSync(path.join(harmonyDir, 'AppScope', 'app.json5'), 'utf8')).app;

  const generatedConfig = {
    expoConfig,
    harmony: {
      bundleName: harmonyApp.bundleName,
      versionCode: harmonyApp.versionCode,
      versionName: harmonyApp.versionName,
    },
  };

  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(generatedConfig, null, 2)}\n`, 'utf8');
}

module.exports = { syncHarmonyConstants };
