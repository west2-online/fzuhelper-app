// Run the installed Expo ADB module with a fake server; never start ADB or an AVD.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const { transformSource, supportedVersion } = require('../android/prepare-expo-cli.cjs');

const expoPackagePath = require.resolve('expo/package.json');
const packagePath = require.resolve('@expo/cli/package.json', { paths: [path.dirname(expoPackagePath)] });
const { version } = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const originalSource = fs.readFileSync(
  path.join(path.dirname(packagePath), 'build/src/start/platforms/android/adb.js'),
  'utf8',
);
const patchedSource = transformSource(originalSource, version).source;
const emulator = 'emulator-5554 device product:sdk_gphone64_x86_64 model:sdk_gphone64_x86_64';
const phone = 'USB123 device usb:1 product:phone model:Pixel_9 device:phone';
const deviceList = (...lines) => ['List of devices attached', ...lines, ''].join(os.EOL);
const normalize = value => JSON.parse(JSON.stringify(value));

function loadAdb(runAsync) {
  class CommandError extends Error {
    constructor(code, message) {
      super(message);
      this.code = code;
    }
  }
  const dependencies = {
    './ADBServer': {
      ADBServer: class {
        runAsync = runAsync;
      },
    },
    '../../../log': {},
    '../../../utils/env': { env: {} },
    '../../../utils/errors': { CommandError },
    '../../../utils/link': {},
    debug: () => () => {},
    os,
  };
  const exports = {};
  new vm.Script(patchedSource, { filename: 'installed-expo-adb.js' }).runInNewContext({
    exports,
    require(name) {
      assert.ok(Object.hasOwn(dependencies, name), `Unexpected dependency: ${name}`);
      return dependencies[name];
    },
  });
  return exports;
}

test('the exact Windows 10061 error is skipped, and the next poll finds the emulator', async () => {
  let namesQueried = 0;
  const adb = loadAdb(async args => {
    if (args[0] === 'devices') return deviceList(emulator);
    assert.deepEqual(normalize(args), ['-s', 'emulator-5554', 'emu', 'avd', 'name']);
    if (++namesQueried === 1) {
      throw new Error(
        'could not connect to TCP port 5554: cannot connect to 127.0.0.1:5554: 由于目标计算机积极拒绝，无法连接。 (10061)',
      );
    }
    return 'Medium_Phone_API_36.1\r\nOK\r\n';
  });
  assert.deepEqual(normalize(await adb.getAttachedDevicesAsync()), []);
  const devices = await adb.getAttachedDevicesAsync();
  assert.equal(devices.length, 1);
  assert.equal(devices[0].name, 'Medium_Phone_API_36.1');
  assert.equal(devices[0].pid, 'emulator-5554');
});

test('offline emulators are not queried and USB phones retain their original metadata', async () => {
  const adb = loadAdb(async args => {
    assert.equal(args[0], 'devices', 'An offline emulator must not receive emu avd name');
    return deviceList('emulator-5554 offline transport_id:1', phone);
  });
  assert.deepEqual(normalize(await adb.getAttachedDevicesAsync()), [
    { pid: 'USB123', name: 'Pixel_9', type: 'device', isAuthorized: true, isBooted: true, connectionType: 'USB' },
  ]);
});

for (const message of [
  'error: device offline',
  "adb: error: device 'emulator-5554' not found",
  'could not connect to TCP port 5554: Connection refused',
]) {
  test(`a transient emulator error does not hide the available phone: ${message}`, async () => {
    const adb = loadAdb(async args => {
      if (args[0] === 'devices') return deviceList(emulator, phone);
      throw new Error(message);
    });
    const devices = await adb.getAttachedDevicesAsync();
    assert.equal(devices.length, 1);
    assert.equal(devices[0].pid, 'USB123');
  });
}

test('a transient emulator error does not hide a second working emulator', async () => {
  const adb = loadAdb(async args => {
    if (args[0] === 'devices') return deviceList(emulator, emulator.replaceAll('5554', '5556'));
    if (args[1] === 'emulator-5554') throw new Error('error: device offline');
    return 'Second_Phone\nOK\n';
  });
  const devices = await adb.getAttachedDevicesAsync();
  assert.equal(devices.length, 1);
  assert.equal(devices[0].pid, 'emulator-5556');
});

for (const message of [
  'unknown command: avd',
  'could not connect to TCP port 5554: Permission denied',
  'cannot connect to 127.0.0.1:5037: Connection refused',
  "device 'emulator-5556' not found",
]) {
  test(`unrelated ADB errors still fail: ${message}`, async () => {
    const failure = new Error(message);
    const adb = loadAdb(async args => {
      if (args[0] === 'devices') return deviceList(emulator);
      throw failure;
    });
    await assert.rejects(adb.getAttachedDevicesAsync(), error => error === failure);
  });
}

test('errors from the devices command still fail', async () => {
  const failure = new Error('error: device offline');
  const adb = loadAdb(async () => {
    throw failure;
  });
  await assert.rejects(adb.getAttachedDevicesAsync(), error => error === failure);
});

test('isDeviceBootedAsync uses the fixed enumeration as well', async () => {
  const adb = loadAdb(async args => {
    if (args[0] === 'devices') return deviceList(emulator);
    throw new Error('could not connect to TCP port 5554: Connection refused');
  });
  assert.equal(await adb.isDeviceBootedAsync({ name: 'Medium_Phone_API_36.1' }), null);
});

test('the source patch is idempotent', () => {
  assert.deepEqual(transformSource(patchedSource, version), { source: patchedSource, changed: false });
});

test('version drift gives an actionable diagnostic', () => {
  assert.throws(
    () => transformSource(originalSource, '57.0.0'),
    /Cannot prepare @expo\/cli 57\.0\.0: the CLI version changed.*prepare-expo-cli\.cjs/,
  );
});

test('missing or partially modified source is not silently patched', () => {
  assert.throws(
    () =>
      transformSource(
        originalSource.replace('async function getAttachedDevicesAsync()', 'async function changed()'),
        supportedVersion,
      ),
    /expected Android device enumeration function was not found/,
  );
  assert.throws(
    () =>
      transformSource(patchedSource.replace('.filter(Boolean);\n}', '.filter(value => value);\n}'), supportedVersion),
    /existing workaround is incomplete or was changed/,
  );
});
