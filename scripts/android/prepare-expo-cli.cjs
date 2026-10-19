#!/usr/bin/env node

// Expo 56 can enumerate an emulator before its console is listening. Keep that
// transient device out of the list so Expo's existing boot polling can continue.
const fs = require('node:fs');
const path = require('node:path');

const supportedVersion = '56.1.16';
const marker = '// fzuhelper: tolerate transient emulator console connections';
const replacements = [
  [
    '    const devicePromises = attachedDevices.map(async (props)=>{',
    `    const devicePromises = attachedDevices.filter(({ type, props })=>
        type !== 'emulator' || props[1] !== 'offline'
    ).map(async (props)=>{`,
  ],
  [
    `            name = await getAdbNameForDeviceIdAsync({
                pid
            }) ?? '';`,
    `            ${marker}
            try {
                name = await getAdbNameForDeviceIdAsync({
                    pid
                }) ?? '';
            } catch (error) {
                const emulatorPort = /^emulator-(\\d+)$/.exec(pid)?.[1];
                const message = [error.message, error.stderr, error.stdout].filter(Boolean).join('\\n');
                const consoleConnection = emulatorPort && new RegExp(
                    '(?:could not connect to TCP port |cannot connect to (?:127\\\\.0\\\\.0\\\\.1|localhost|\\\\[::1\\\\]):)' + emulatorPort + '(?:\\\\D|$)',
                    'i'
                ).test(message);
                const refused = /(?:Connection refused|ECONNREFUSED|10061)/i.test(message);
                const offline = /(?:^|\\n)(?:adb(?:\\.exe)?:\\s*)?(?:error:\\s*)?device offline\\s*(?:$|\\n)/i.test(message);
                const disappeared = emulatorPort && new RegExp(
                    "device ['\\"]?" + pid + "['\\"]? not found",
                    'i'
                ).test(message);
                if (emulatorPort && ((consoleConnection && refused) || offline || disappeared)) {
                    return null;
                }
                throw error;
            }`,
  ],
  ['    return Promise.all(devicePromises);', '    return (await Promise.all(devicePromises)).filter(Boolean);'],
];

function transformSource(source, version) {
  const diagnostic = reason =>
    new Error(
      `Cannot prepare @expo/cli ${version}: ${reason}. ` +
        `Review scripts/android/prepare-expo-cli.cjs against the installed CLI; this workaround targets ${supportedVersion}.`,
    );
  if (version !== supportedVersion) {
    throw diagnostic('the CLI version changed');
  }

  const normalized = source.replace(/\r\n/g, '\n');
  const start = 'async function getAttachedDevicesAsync() {';
  const end = '\nasync function getAdbNameForDeviceIdAsync(device) {';
  const startIndex = normalized.indexOf(start);
  const endIndex = normalized.indexOf(end, startIndex);
  if (
    startIndex < 0 ||
    endIndex < 0 ||
    normalized.indexOf(start, startIndex + start.length) >= 0 ||
    normalized.indexOf(end, endIndex + end.length) >= 0
  ) {
    throw diagnostic('the expected Android device enumeration function was not found');
  }

  const body = normalized.slice(startIndex, endIndex);
  const occursOnce = (text, fragment) => text.split(fragment).length === 2;
  if (body.includes(marker)) {
    if (!replacements.every(([, replacement]) => occursOnce(body, replacement))) {
      throw diagnostic('the existing workaround is incomplete or was changed');
    }
    return { source, changed: false };
  }
  if (!replacements.every(([original]) => occursOnce(body, original))) {
    throw diagnostic('the Android device enumeration source changed');
  }

  const patchedBody = replacements.reduce((text, [original, replacement]) => text.replace(original, replacement), body);
  return {
    source: normalized.slice(0, startIndex) + patchedBody + normalized.slice(endIndex),
    changed: true,
  };
}

function prepareExpoCli(projectDir = path.resolve(__dirname, '../..')) {
  const expoPackagePath = require.resolve('expo/package.json', { paths: [projectDir] });
  const packagePath = require.resolve('@expo/cli/package.json', { paths: [path.dirname(expoPackagePath)] });
  const { version } = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const sourcePath = path.join(path.dirname(packagePath), 'build/src/start/platforms/android/adb.js');
  const result = transformSource(fs.readFileSync(sourcePath, 'utf8'), version);
  if (result.changed) {
    fs.writeFileSync(sourcePath, result.source);
    console.log(`Prepared Expo CLI ${version} for transient Android emulator connections.`);
  }
  return result.changed;
}

if (require.main === module) {
  try {
    prepareExpoCli();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { transformSource, prepareExpoCli, supportedVersion };
