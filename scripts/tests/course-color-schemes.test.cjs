// Offline behavior checks: native storage and Metro context are isolated; no app data is touched.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '../..');
const assetsDirectory = path.join(root, 'assets/course-color-schemes');
const customStorageKey = 'custom_course_color_schemes_v1';
const recoveryStorageKey = 'custom_course_color_schemes_recovery_v1';
const clone = value => JSON.parse(JSON.stringify(value));
const same = (actual, expected) => assert.deepEqual(clone(actual), clone(expected));
const silentConsole = { log() {}, warn() {}, error() {} };

function compile(relativePath, dependencies = {}, requireContext, runtime = {}) {
  const filename = path.join(root, relativePath);
  const result = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    fileName: filename,
    reportDiagnostics: true,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  });
  const errors = (result.diagnostics || []).filter(d => d.category === ts.DiagnosticCategory.Error);
  assert.equal(errors.length, 0, `Cannot transpile ${relativePath}`);
  const module = { exports: {} };
  const localRequire = name => {
    assert.ok(Object.hasOwn(dependencies, name), `Unmocked dependency: ${relativePath} -> ${name}`);
    return dependencies[name];
  };
  localRequire.context = requireContext;
  const deterministicMath = Object.create(Math);
  deterministicMath.random = () => 0;
  new vm.Script(result.outputText, { filename }).runInNewContext({
    module,
    exports: module.exports,
    require: localRequire,
    console: silentConsole,
    Math: deterministicMath,
    ...runtime,
  });
  return module.exports;
}

const constants = compile('lib/constants.ts');

function createStorage() {
  const values = new Map();
  const writes = [];
  const hooks = { read: null, write: null };
  return {
    values,
    writes,
    hooks,
    async getItem(key) {
      if (hooks.read) await hooks.read(key);
      return values.get(key) ?? null;
    },
    async setItem(key, value) {
      if (hooks.write) await hooks.write(key, value);
      values.set(key, value);
      writes.push({ key, value });
    },
  };
}

function createRegistry(storage = createStorage(), directory = assetsDirectory, runtime = {}) {
  const calls = [];
  const registry = compile(
    'lib/course-color-schemes.ts',
    { '@react-native-async-storage/async-storage': storage, '@/lib/constants': constants, './constants': constants },
    (requestedDirectory, recursive, filter) => {
      calls.push({ requestedDirectory, recursive });
      assert.equal(path.resolve(root, 'lib', requestedDirectory), assetsDirectory);
      const keys = fs
        .readdirSync(directory)
        .map(filename => `./${filename}`)
        .filter(key => filter.test(key));
      const context = key => {
        assert.ok(keys.includes(key), `Context requested unknown asset ${key}`);
        return JSON.parse(fs.readFileSync(path.join(directory, key.slice(2)), 'utf8'));
      };
      context.keys = () => keys;
      return context;
    },
    runtime,
  );
  assert.equal(calls.length, 1, 'Built-in schemes must be discovered through the directory context');
  return { registry, storage };
}

const colorsWith = (...prefix) => {
  const colors = [...prefix];
  for (let i = 1; colors.length < 25; i++) {
    const color = `#${i.toString(16).padStart(6, '0').toUpperCase()}`;
    if (!colors.some(existing => existing.toUpperCase() === color)) colors.push(color);
  }
  return colors;
};
const scheme = (id, colors = colorsWith('#123456', '#ABCDEF')) => ({ id, name: `方案 ${id}`, colors });
const importScheme = (registry, value) => registry.importCourseColorScheme(JSON.stringify(value));

// Asset content is intentionally editable. Verify directory registration against the current files.
const builtinDefinitions = fs
  .readdirSync(assetsDirectory)
  .filter(filename => filename.endsWith('.json'))
  .map(filename => JSON.parse(fs.readFileSync(path.join(assetsDirectory, filename), 'utf8')));
const currentColors = Object.fromEntries(builtinDefinitions.map(item => [item.id, item.colors]));
const builtinCount = builtinDefinitions.length;

test('all current built-in JSON schemes register their identifiers, names and every ordered color', () => {
  const { registry } = createRegistry();
  for (const { id, name, colors } of builtinDefinitions) {
    same(registry.getCourseColors(id), colors);
    assert.equal(registry.normalizeCourseColorScheme(id), id);
    assert.equal(registry.getCourseColorScheme(id).name, name.trim());
    assert.equal(registry.getCourseColorScheme(id).source, 'builtin');
    assert.equal(colors.length, 25);
  }
  assert.equal(registry.getCourseColorSchemes().length, builtinCount);
  assert.equal(registry.getCourseColorSchemes()[0].id, 'old');
  assert.equal(registry.normalizeCourseColorScheme('missing'), 'old');
});

test('an additional JSON file registers without changing any source registration list', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'course-color-context-'));
  t.after(() => {
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(directory).startsWith('course-color-context-'));
    fs.rmSync(directory, { recursive: true, force: true });
  });
  for (const filename of fs.readdirSync(assetsDirectory).filter(entry => entry.endsWith('.json'))) {
    fs.copyFileSync(path.join(assetsDirectory, filename), path.join(directory, filename));
  }
  fs.writeFileSync(path.join(directory, 'future-palette.json'), JSON.stringify(scheme('future-palette')));
  const { registry } = createRegistry(createStorage(), directory);
  assert.ok(registry.getCourseColorSchemes().some(item => item.id === 'future-palette'));
  assert.equal(registry.normalizeCourseColorScheme('future-palette'), 'future-palette');
  same(registry.getCourseColors('future-palette'), scheme('future-palette').colors);
});

test('JSON validation rejects malformed documents and invalid schema before any storage write', async t => {
  const { registry, storage } = createRegistry();
  const invalid = [
    ['malformed JSON', '{'],
    ['null root', 'null'],
    ['array root', '[]'],
    ['absent id', JSON.stringify({ name: 'x', colors: ['#123456'] })],
    ['uppercase id', JSON.stringify(scheme('My-Palette'))],
    ['numeric first id character', JSON.stringify(scheme('1-palette'))],
    ['id whitespace', JSON.stringify(scheme('my palette'))],
    ['long id', JSON.stringify(scheme('a'.repeat(65)))],
    ['empty name', JSON.stringify({ ...scheme('valid'), name: '' })],
    ['whitespace name', JSON.stringify({ ...scheme('valid'), name: '   ' })],
    ['long name', JSON.stringify({ ...scheme('valid'), name: '名'.repeat(41) })],
    ['non-string name', JSON.stringify({ ...scheme('valid'), name: 1 })],
    ['no colors', JSON.stringify(scheme('valid', []))],
    ['non-array colors', JSON.stringify(scheme('valid', '#123456'))],
    ['short hex color', JSON.stringify(scheme('valid', ['#ABC', ...colorsWith().slice(1)]))],
    ['hex alpha color', JSON.stringify(scheme('valid', ['#123456FF', ...colorsWith().slice(1)]))],
    ['named color', JSON.stringify(scheme('valid', ['red', ...colorsWith().slice(1)]))],
    ['non-string color', JSON.stringify(scheme('valid', [123456, ...colorsWith().slice(1)]))],
    [
      'duplicate color ignoring case',
      JSON.stringify(scheme('valid', ['#abcdef', '#ABCDEF', ...colorsWith().slice(2)])),
    ],
    [
      '26 colors',
      JSON.stringify(
        scheme(
          'valid',
          Array.from({ length: 26 }, (_, i) => `#${i.toString(16).padStart(6, '0')}`),
        ),
      ),
    ],
    ['24 colors', JSON.stringify(scheme('valid', colorsWith().slice(0, 24)))],
    ['oversized text', JSON.stringify(scheme('valid')) + ' '.repeat(32768)],
  ];
  for (const [name, input] of invalid) {
    await t.test(name, async () => {
      assert.throws(() => registry.parseCourseColorSchemeJson(input));
      await assert.rejects(registry.importCourseColorScheme(input));
    });
  }
  assert.equal(storage.writes.length, 0);
  assert.equal(registry.getCourseColorSchemes().length, builtinCount);
});

test('valid boundary inputs accept exactly 25 colors, 64-character ids, and 40-character names', () => {
  const { registry } = createRegistry();
  assert.equal(registry.COURSE_COLOR_SCHEME_COLOR_COUNT, 25);
  const value = {
    id: 'a'.repeat(64),
    name: '名'.repeat(40),
    colors: Array.from({ length: 25 }, (_, i) => `#${i.toString(16).padStart(6, '0')}`),
  };
  const parsed = registry.parseCourseColorSchemeJson(JSON.stringify(value));
  assert.equal(parsed.id, value.id);
  assert.equal(parsed.name, value.name);
  same(
    parsed.colors,
    value.colors.map(color => color.toUpperCase()),
  );
});

test('edited names use ASCII weight one and non-ASCII weight two with a 16-unit limit', () => {
  const { registry } = createRegistry();
  assert.equal(registry.MAX_COURSE_COLOR_SCHEME_NAME_LENGTH, 16);
  assert.equal(registry.getCourseColorSchemeNameLength('ASCII'), 5);
  assert.equal(registry.getCourseColorSchemeNameLength('A海🙂'), 5);
  assert.equal(registry.validateCourseColorSchemeName('  海风配色  '), '海风配色');
  assert.equal(registry.validateCourseColorSchemeName('A'.repeat(16)), 'A'.repeat(16));
  assert.equal(registry.validateCourseColorSchemeName('海'.repeat(8)), '海'.repeat(8));
  assert.equal(registry.validateCourseColorSchemeName('海'.repeat(7) + 'ab'), '海'.repeat(7) + 'ab');
  const tooLong = /配色名称过长，最多 16 个英文字符或 8 个汉字。/;
  assert.throws(() => registry.validateCourseColorSchemeName('A'.repeat(17)), tooLong);
  assert.throws(() => registry.validateCourseColorSchemeName('海'.repeat(9)), tooLong);
  assert.throws(() => registry.validateCourseColorSchemeName('海'.repeat(7) + 'abc'), tooLong);
  assert.throws(() => registry.validateCourseColorSchemeName('   '), /请输入配色名称/);
});

test('color input accepts a colors array, an object and a field fragment without requiring an id or name', () => {
  const { registry } = createRegistry();
  const colors = colorsWith('#abcdef');
  const array = JSON.stringify(colors);
  const inputs = [
    array,
    JSON.stringify({ colors }),
    `  "colors" : ${array}\n`,
    JSON.stringify({ id: 'ignored', name: 'ignored', colors }),
  ];
  for (const input of inputs) same(registry.parseCourseColorsJson(input), colorsWith('#ABCDEF'));
});

test('color-only input rejects malformed fragments, wrong counts, duplicates and invalid hex values', () => {
  const { registry } = createRegistry();
  const invalid = [
    '',
    '{',
    'null',
    '{}',
    '"colors":',
    '"red"',
    JSON.stringify(colorsWith().slice(0, 24)),
    JSON.stringify({ colors: [...colorsWith(), '#FFFFFF'] }),
    JSON.stringify(['#abcdef', '#ABCDEF', ...colorsWith().slice(2)]),
    JSON.stringify(['#ABC', ...colorsWith().slice(1)]),
    JSON.stringify(colorsWith()) + ' '.repeat(32768),
  ];
  for (const input of invalid) assert.throws(() => registry.parseCourseColorsJson(input));
});

test('new saves generate a six-digit hexadecimal local id and preserve it after restart', async () => {
  const { registry, storage } = createRegistry();
  const palette = await registry.saveCourseColorScheme({ name: '  我的海洋  ', colors: colorsWith('#abcdef') });
  assert.match(palette.id, /^[0-9a-f]{6}$/);
  assert.equal(palette.name, '我的海洋');
  assert.equal(palette.source, 'custom');
  same(palette.colors, colorsWith('#ABCDEF'));
  const restarted = createRegistry(storage).registry;
  await restarted.loadCourseColorSchemes();
  same(restarted.getCourseColorScheme(palette.id), palette);
});

test('local hash generation retries a collision with an existing saved id', async () => {
  const runtime = { Date: { now: () => 1700000000000 } };
  const { registry, storage } = createRegistry(createStorage(), assetsDirectory, runtime);
  const first = await registry.saveCourseColorScheme({ name: 'First', colors: colorsWith('#111111') });
  // A fresh module repeats the first seed exactly: fixed clock, random zero and counter zero.
  const restarted = createRegistry(storage, assetsDirectory, runtime).registry;
  const second = await restarted.saveCourseColorScheme({ name: 'Second', colors: colorsWith('#222222') });
  assert.match(second.id, /^[0-9a-f]{6}$/);
  assert.notEqual(second.id, first.id);
  same(restarted.getCourseColorScheme(first.id), first);
  same(restarted.getCourseColorScheme(second.id), second);
  assert.equal(JSON.parse(storage.values.get(customStorageKey)).length, 2);
});

test('editing at the five-palette limit retains the id and order while new saves are rejected', async () => {
  const { registry, storage } = createRegistry();
  const created = [];
  for (let i = 0; i < 5; i++) {
    created.push(await registry.saveCourseColorScheme({ name: `Palette ${i}`, colors: colorsWith() }));
  }
  const updated = await registry.saveCourseColorScheme({
    id: created[2].id,
    name: '海'.repeat(8),
    colors: colorsWith('#654321'),
  });
  assert.equal(updated.id, created[2].id);
  assert.equal(updated.name, '海'.repeat(8));
  same(updated.colors, colorsWith('#654321'));
  same(
    registry
      .getCourseColorSchemes()
      .filter(item => item.source === 'custom')
      .map(item => item.id),
    created.map(item => item.id),
  );
  same(registry.getCourseColorScheme(created[1].id), created[1]);
  await assert.rejects(registry.saveCourseColorScheme({ name: 'Sixth', colors: colorsWith() }), /最多可保存 5/);
  assert.equal(storage.writes.length, 6);
  const restarted = createRegistry(storage).registry;
  await restarted.loadCourseColorSchemes();
  same(restarted.getCourseColorScheme(updated.id), updated);
});

test('save rejects built-in editing, unknown edit ids and invalid name or color inputs without writing', async () => {
  const { registry, storage } = createRegistry();
  await assert.rejects(registry.saveCourseColorScheme({ id: 'old', name: 'Edit', colors: colorsWith() }), /不能修改/);
  await assert.rejects(registry.saveCourseColorScheme({ id: 'missing', name: 'Edit', colors: colorsWith() }), /不存在/);
  await assert.rejects(registry.saveCourseColorScheme({ name: '海'.repeat(9), colors: colorsWith() }), /16/);
  await assert.rejects(registry.saveCourseColorScheme({ name: ' ', colors: colorsWith() }), /请输入配色名称/);
  await assert.rejects(registry.saveCourseColorScheme({ name: 'Edit', colors: colorsWith().slice(1) }), /25/);
  assert.equal(storage.writes.length, 0);
});

test('a failed edit preserves the old name, colors, order and stored data until a successful retry', async () => {
  const { registry, storage } = createRegistry();
  const original = await registry.saveCourseColorScheme({ name: 'Original', colors: colorsWith('#111111') });
  const snapshot = registry.getCourseColorSchemes();
  const raw = storage.values.get(customStorageKey);
  let notifications = 0;
  registry.subscribeCourseColorSchemes(() => {
    notifications++;
  });
  storage.hooks.write = async () => {
    throw Error('save unavailable');
  };
  const changes = { id: original.id, name: 'Updated', colors: colorsWith('#222222') };
  await assert.rejects(registry.saveCourseColorScheme(changes));
  assert.equal(registry.getCourseColorSchemes(), snapshot);
  assert.equal(storage.values.get(customStorageKey), raw);
  same(registry.getCourseColorScheme(original.id), original);
  assert.equal(notifications, 0);
  storage.hooks.write = null;
  const updated = await registry.saveCourseColorScheme(changes);
  assert.equal(updated.name, 'Updated');
  assert.equal(notifications, 1);
});

test('legacy ids and long names still load, and editing backs up skipped data without changing unrelated legacy names', async () => {
  const storage = createStorage();
  const legacyName = '旧'.repeat(20);
  const raw = JSON.stringify([
    { ...scheme('legacy-long-id'), name: legacyName },
    { ...scheme('123abc'), name: legacyName },
    scheme('invalid', ['red']),
  ]);
  storage.values.set(customStorageKey, raw);
  const { registry } = createRegistry(storage);
  await registry.loadCourseColorSchemes();
  assert.equal(registry.getCourseColorScheme('legacy-long-id').name, legacyName);
  assert.equal(registry.getCourseColorScheme('123abc').name, legacyName);
  assert.equal(storage.writes.length, 0);
  await registry.saveCourseColorScheme({ id: 'legacy-long-id', name: '新名称', colors: colorsWith('#987654') });
  assert.equal(storage.values.get(recoveryStorageKey), raw);
  same(
    storage.writes.map(write => write.key),
    [recoveryStorageKey, customStorageKey],
  );
  assert.equal(registry.getCourseColorScheme('legacy-long-id').name, '新名称');
  assert.equal(registry.getCourseColorScheme('123abc').name, legacyName);
  assert.equal(registry.getCourseColorSchemeLoadWarning(), '');
});

test('concurrent creation and editing preserve both changes at the capacity boundary', async () => {
  const { registry, storage } = createRegistry();
  const created = [];
  for (let i = 0; i < 4; i++) {
    created.push(await registry.saveCourseColorScheme({ name: `Palette ${i}`, colors: colorsWith() }));
  }
  const [fifth, edited] = await Promise.all([
    registry.saveCourseColorScheme({ name: 'Fifth', colors: colorsWith('#555555') }),
    registry.saveCourseColorScheme({ id: created[0].id, name: 'Edited', colors: colorsWith('#111111') }),
  ]);
  assert.equal(registry.getCourseColorSchemes().filter(item => item.source === 'custom').length, 5);
  same(registry.getCourseColorScheme(fifth.id), fifth);
  same(registry.getCourseColorScheme(edited.id), edited);
  assert.equal(JSON.parse(storage.values.get(customStorageKey)).length, 5);
});

test('editing a concurrently deleted id fails instead of recreating it and leaves the mutation queue usable', async () => {
  const { registry } = createRegistry();
  const original = await registry.saveCourseColorScheme({ name: 'Original', colors: colorsWith() });
  const results = await Promise.allSettled([
    registry.deleteCourseColorScheme(original.id),
    registry.saveCourseColorScheme({ id: original.id, name: 'Updated', colors: colorsWith() }),
  ]);
  assert.equal(results[0].status, 'fulfilled');
  assert.equal(results[1].status, 'rejected');
  assert.match(results[1].reason.message, /不存在/);
  assert.equal(registry.normalizeCourseColorScheme(original.id), 'old');
  const next = await registry.saveCourseColorScheme({ name: 'Next', colors: colorsWith() });
  assert.equal(registry.normalizeCourseColorScheme(next.id), next.id);
});

test('duplicate built-in and imported ids cannot overwrite their original colors', async () => {
  const { registry, storage } = createRegistry();
  await assert.rejects(importScheme(registry, scheme('old', colorsWith('#FFFFFF'))), /已存在/);
  await importScheme(registry, scheme('mine'));
  await assert.rejects(importScheme(registry, scheme('mine', colorsWith('#FFFFFF'))), /已存在/);
  same(registry.getCourseColors('old'), currentColors.old);
  same(registry.getCourseColors('mine'), scheme('mine').colors);
  assert.equal(storage.writes.length, 1);
});

test('concurrent imports retain both schemes after restart', async () => {
  const { registry, storage } = createRegistry();
  await Promise.all([importScheme(registry, scheme('first')), importScheme(registry, scheme('second'))]);
  const restarted = createRegistry(storage).registry;
  await restarted.loadCourseColorSchemes();
  assert.equal(restarted.normalizeCourseColorScheme('first'), 'first');
  assert.equal(restarted.normalizeCourseColorScheme('second'), 'second');
});

test('concurrent initial loads share storage reads and a failed read can be retried', async () => {
  const { registry, storage } = createRegistry();
  let readCount = 0;
  storage.hooks.read = async () => {
    readCount++;
    throw Error('storage temporarily unavailable');
  };
  const initial = await Promise.allSettled([registry.loadCourseColorSchemes(), registry.loadCourseColorSchemes()]);
  assert.equal(initial.filter(item => item.status === 'rejected').length, 2);
  assert.equal(readCount, 1);
  storage.hooks.read = null;
  await importScheme(registry, { id: 'retry', name: '  Retry palette  ', colors: colorsWith('#aabbcc') });
  assert.equal(registry.getCourseColorScheme('retry').name, 'Retry palette');
  same(registry.getCourseColors('retry'), colorsWith('#AABBCC'));
});

test('concurrent imports of one id allow exactly one persisted scheme', async () => {
  const { registry, storage } = createRegistry();
  const result = await Promise.allSettled([
    importScheme(registry, scheme('same', colorsWith('#111111'))),
    importScheme(registry, scheme('same', colorsWith('#222222'))),
  ]);
  assert.equal(result.filter(item => item.status === 'fulfilled').length, 1);
  assert.equal(storage.writes.length, 1);
  assert.equal(registry.getCourseColorSchemes().filter(item => item.id === 'same').length, 1);
});

test('a persistence failure never registers a scheme or blocks later imports', async () => {
  const { registry, storage } = createRegistry();
  storage.hooks.write = async () => {
    throw Error('disk unavailable');
  };
  await assert.rejects(importScheme(registry, scheme('failed')));
  assert.equal(registry.normalizeCourseColorScheme('failed'), 'old');
  storage.hooks.write = null;
  await importScheme(registry, scheme('recovered'));
  assert.equal(registry.normalizeCourseColorScheme('recovered'), 'recovered');
  const restarted = createRegistry(storage).registry;
  await restarted.loadCourseColorSchemes();
  assert.equal(restarted.normalizeCourseColorScheme('failed'), 'old');
  assert.equal(restarted.normalizeCourseColorScheme('recovered'), 'recovered');
});

test('a pending storage write remains invisible until persistence completes', async () => {
  const { registry, storage } = createRegistry();
  let releaseWrite;
  let enteredWrite;
  const entered = new Promise(resolve => {
    enteredWrite = resolve;
  });
  const barrier = new Promise(resolve => {
    releaseWrite = resolve;
  });
  storage.hooks.write = async () => {
    enteredWrite();
    await barrier;
  };
  const pending = importScheme(registry, scheme('pending'));
  await entered;
  assert.equal(registry.normalizeCourseColorScheme('pending'), 'old');
  releaseWrite();
  await pending;
  assert.equal(registry.normalizeCourseColorScheme('pending'), 'pending');
});

test('the fifth custom scheme is saved and the sixth is rejected after restart without affecting built-ins', async () => {
  const { registry, storage } = createRegistry();
  assert.equal(registry.MAX_CUSTOM_COURSE_COLOR_SCHEMES, 5);
  for (let i = 0; i < 5; i++) await importScheme(registry, scheme(`palette-${i}`));
  const restarted = createRegistry(storage).registry;
  await restarted.loadCourseColorSchemes();
  await assert.rejects(importScheme(restarted, scheme('over-limit')), /最多可保存 5/);
  assert.equal(restarted.getCourseColorSchemes().length, builtinCount + 5);
  assert.equal(storage.writes.length, 5);
  same(restarted.getCourseColors('old'), currentColors.old);
});

test('concurrent imports at four saved schemes admit only the fifth and do not overwrite it', async () => {
  const { registry, storage } = createRegistry();
  for (let i = 0; i < 4; i++) await importScheme(registry, scheme(`existing-${i}`));
  const results = await Promise.allSettled([
    importScheme(registry, scheme('fifth')),
    importScheme(registry, scheme('sixth')),
  ]);
  assert.equal(results[0].status, 'fulfilled');
  assert.equal(results[1].status, 'rejected');
  assert.match(results[1].reason.message, /最多可保存 5/);
  assert.equal(storage.writes.length, 5);
  const restarted = createRegistry(storage).registry;
  await restarted.loadCourseColorSchemes();
  assert.equal(restarted.normalizeCourseColorScheme('fifth'), 'fifth');
  assert.equal(restarted.normalizeCourseColorScheme('sixth'), 'old');
  assert.equal(restarted.getCourseColorSchemes().filter(item => item.source === 'custom').length, 5);
});

test('deleting a saved custom scheme persists the removal and leaves other palettes unchanged', async () => {
  const { registry, storage } = createRegistry();
  await importScheme(registry, scheme('remove-me'));
  await importScheme(registry, scheme('keep-me', colorsWith('#654321')));
  await registry.deleteCourseColorScheme('remove-me');
  assert.equal(registry.normalizeCourseColorScheme('remove-me'), 'old');
  same(registry.getCourseColors('keep-me'), colorsWith('#654321'));
  same(registry.getCourseColors('old'), currentColors.old);
  const restarted = createRegistry(storage).registry;
  await restarted.loadCourseColorSchemes();
  same(
    restarted
      .getCourseColorSchemes()
      .filter(item => item.source === 'custom')
      .map(item => item.id),
    ['keep-me'],
  );
});

test('built-in and unknown schemes cannot be deleted and failed requests do not block the queue', async () => {
  const { registry, storage } = createRegistry();
  await assert.rejects(registry.deleteCourseColorScheme('old'), /内置配色方案不能删除/);
  await assert.rejects(registry.deleteCourseColorScheme('missing'), /不存在/);
  assert.equal(storage.writes.length, 0);
  await importScheme(registry, scheme('later'));
  await registry.deleteCourseColorScheme('later');
  await assert.rejects(registry.deleteCourseColorScheme('later'), /不存在/);
  assert.equal(storage.writes.length, 2);
  same(JSON.parse(storage.values.get(customStorageKey)), []);
});

test('a failed deletion leaves the persisted scheme, snapshot and subscribers unchanged until retry succeeds', async () => {
  const { registry, storage } = createRegistry();
  await importScheme(registry, scheme('keep-until-saved'));
  const snapshot = registry.getCourseColorSchemes();
  const stored = storage.values.get(customStorageKey);
  let notifications = 0;
  const unsubscribe = registry.subscribeCourseColorSchemes(() => {
    notifications++;
  });
  storage.hooks.write = async () => {
    throw Error('storage unavailable');
  };
  await assert.rejects(registry.deleteCourseColorScheme('keep-until-saved'));
  assert.equal(registry.getCourseColorSchemes(), snapshot);
  assert.equal(storage.values.get(customStorageKey), stored);
  assert.equal(registry.normalizeCourseColorScheme('keep-until-saved'), 'keep-until-saved');
  assert.equal(notifications, 0);
  storage.hooks.write = null;
  await registry.deleteCourseColorScheme('keep-until-saved');
  assert.equal(registry.normalizeCourseColorScheme('keep-until-saved'), 'old');
  assert.equal(notifications, 1);
  unsubscribe();
});

test('a pending deletion stays visible and notifies subscribers only after the storage write completes', async () => {
  const { registry, storage } = createRegistry();
  await importScheme(registry, scheme('pending-delete'));
  const snapshot = registry.getCourseColorSchemes();
  let releaseWrite;
  let enteredWrite;
  const entered = new Promise(resolve => {
    enteredWrite = resolve;
  });
  const barrier = new Promise(resolve => {
    releaseWrite = resolve;
  });
  storage.hooks.write = async () => {
    enteredWrite();
    await barrier;
  };
  let notifications = 0;
  let notifiedState;
  registry.subscribeCourseColorSchemes(() => {
    notifications++;
    notifiedState = {
      normalized: registry.normalizeCourseColorScheme('pending-delete'),
      persisted: JSON.parse(storage.values.get(customStorageKey)),
    };
  });
  const pending = registry.deleteCourseColorScheme('pending-delete');
  await entered;
  assert.equal(registry.getCourseColorSchemes(), snapshot);
  assert.equal(registry.normalizeCourseColorScheme('pending-delete'), 'pending-delete');
  assert.equal(notifications, 0);
  releaseWrite();
  await pending;
  assert.equal(notifications, 1);
  same(notifiedState, { normalized: 'old', persisted: [] });
  assert.equal(registry.normalizeCourseColorScheme('pending-delete'), 'old');
});

test('a queued deletion frees the fifth slot before a concurrent import is checked', async () => {
  const { registry, storage } = createRegistry();
  for (let i = 0; i < 5; i++) await importScheme(registry, scheme(`saved-${i}`));
  await Promise.all([registry.deleteCourseColorScheme('saved-2'), importScheme(registry, scheme('replacement'))]);
  assert.equal(registry.normalizeCourseColorScheme('saved-2'), 'old');
  assert.equal(registry.normalizeCourseColorScheme('replacement'), 'replacement');
  assert.equal(registry.getCourseColorSchemes().filter(item => item.source === 'custom').length, 5);
  const restarted = createRegistry(storage).registry;
  await restarted.loadCourseColorSchemes();
  assert.equal(restarted.normalizeCourseColorScheme('saved-2'), 'old');
  assert.equal(restarted.normalizeCourseColorScheme('replacement'), 'replacement');
  assert.equal(storage.writes.length, 7);
});

test('concurrent import followed by deletion cannot resurrect the deleted scheme', async () => {
  const { registry, storage } = createRegistry();
  await Promise.all([
    importScheme(registry, scheme('new-then-deleted')),
    registry.deleteCourseColorScheme('new-then-deleted'),
  ]);
  assert.equal(registry.normalizeCourseColorScheme('new-then-deleted'), 'old');
  same(JSON.parse(storage.values.get(customStorageKey)), []);
  assert.equal(storage.writes.length, 2);
});

test('a full-capacity import rejection does not block a queued deletion or the next import', async () => {
  const { registry } = createRegistry();
  for (let i = 0; i < 5; i++) await importScheme(registry, scheme(`saved-${i}`));
  const results = await Promise.allSettled([
    importScheme(registry, scheme('too-early')),
    registry.deleteCourseColorScheme('saved-0'),
  ]);
  assert.equal(results[0].status, 'rejected');
  assert.match(results[0].reason.message, /最多可保存 5/);
  assert.equal(results[1].status, 'fulfilled');
  assert.equal(registry.getCourseColorSchemes().filter(item => item.source === 'custom').length, 4);
  await importScheme(registry, scheme('now-available'));
  assert.equal(registry.normalizeCourseColorScheme('now-available'), 'now-available');
});

test('damaged or conflicting saved palettes preserve raw data while valid palettes remain usable', async t => {
  const inputs = [
    ['malformed JSON', '{bad json', []],
    ['non-array root', '{}', []],
    ['mixed records', JSON.stringify([scheme('good'), scheme('bad', ['red']), scheme('old')]), ['good']],
    ['duplicate custom id', JSON.stringify([scheme('good'), scheme('good', colorsWith('#FFFFFF'))]), ['good']],
    [
      'legacy records with 24 or 26 colors',
      JSON.stringify([
        scheme('short', colorsWith().slice(0, 24)),
        scheme('good'),
        scheme('long', [...colorsWith(), '#FFFFFF']),
      ]),
      ['good'],
    ],
  ];
  for (const [name, raw, expected] of inputs) {
    await t.test(name, async () => {
      const storage = createStorage();
      storage.values.set(customStorageKey, raw);
      const { registry } = createRegistry(storage);
      await registry.loadCourseColorSchemes();
      assert.ok(registry.getCourseColorSchemeLoadWarning());
      same(
        registry
          .getCourseColorSchemes()
          .filter(item => item.source === 'custom')
          .map(item => item.id),
        expected,
      );
      same(registry.getCourseColors('old'), currentColors.old);
      assert.equal(storage.values.get(customStorageKey), raw);
      assert.equal(storage.writes.length, 0);
    });
  }
});

test('import after damaged data first backs up the exact original and clears the recovery warning', async () => {
  const storage = createStorage();
  const raw = JSON.stringify([scheme('good'), scheme('bad', ['red'])]);
  storage.values.set(customStorageKey, raw);
  const { registry } = createRegistry(storage);
  await registry.loadCourseColorSchemes();
  await importScheme(registry, scheme('new'));
  same(
    storage.writes.map(write => write.key),
    [recoveryStorageKey, customStorageKey],
  );
  assert.equal(storage.values.get(recoveryStorageKey), raw);
  same(
    JSON.parse(storage.values.get(customStorageKey)).map(item => item.id),
    ['good', 'new'],
  );
  assert.equal(registry.getCourseColorSchemeLoadWarning(), '');
  await importScheme(registry, scheme('later'));
  assert.equal(storage.writes.filter(write => write.key === recoveryStorageKey).length, 1);
  assert.equal(storage.values.get(recoveryStorageKey), raw);
});

test('legacy wrong-length palettes do not occupy the five slots and are backed up before filling the last slot', async () => {
  const storage = createStorage();
  const existing = Array.from({ length: 4 }, (_, i) => scheme(`existing-${i}`));
  const raw = JSON.stringify([scheme('legacy-short', ['#123456']), ...existing]);
  storage.values.set(customStorageKey, raw);
  const { registry } = createRegistry(storage);
  await registry.loadCourseColorSchemes();
  assert.equal(registry.getCourseColorSchemes().filter(item => item.source === 'custom').length, 4);
  assert.equal(registry.normalizeCourseColorScheme('legacy-short'), 'old');
  assert.equal(storage.values.get(customStorageKey), raw);
  assert.equal(storage.writes.length, 0);
  await importScheme(registry, scheme('fifth'));
  assert.equal(storage.values.get(recoveryStorageKey), raw);
  assert.equal(JSON.parse(storage.values.get(customStorageKey)).length, 5);
  assert.equal(registry.getCourseColorSchemeLoadWarning(), '');
  await assert.rejects(importScheme(registry, scheme('sixth')), /最多可保存 5/);
  assert.equal(storage.writes.length, 2);
});

test('an over-capacity saved list exposes five valid palettes while preserving every original record', async () => {
  const storage = createStorage();
  const raw = JSON.stringify(Array.from({ length: 7 }, (_, i) => scheme(`saved-${i}`)));
  storage.values.set(customStorageKey, raw);
  const { registry } = createRegistry(storage);
  await registry.loadCourseColorSchemes();
  same(
    registry
      .getCourseColorSchemes()
      .filter(item => item.source === 'custom')
      .map(item => item.id),
    Array.from({ length: 5 }, (_, i) => `saved-${i}`),
  );
  assert.ok(registry.getCourseColorSchemeLoadWarning());
  assert.equal(storage.values.get(customStorageKey), raw);
  await assert.rejects(importScheme(registry, scheme('another')), /最多可保存 5/);
  assert.equal(storage.writes.length, 0);
});

test('a failed recovery backup leaves original data and registry intact and allows retry', async () => {
  const storage = createStorage();
  const raw = 'broken JSON';
  storage.values.set(customStorageKey, raw);
  const { registry } = createRegistry(storage);
  await registry.loadCourseColorSchemes();
  storage.hooks.write = async key => {
    if (key === recoveryStorageKey) throw Error('cannot write recovery backup');
  };
  await assert.rejects(importScheme(registry, scheme('new')));
  assert.equal(storage.values.get(customStorageKey), raw);
  assert.equal(storage.writes.length, 0);
  assert.equal(registry.normalizeCourseColorScheme('new'), 'old');
  assert.ok(registry.getCourseColorSchemeLoadWarning());
  storage.hooks.write = null;
  await importScheme(registry, scheme('new'));
  assert.equal(storage.values.get(recoveryStorageKey), raw);
  assert.equal(registry.normalizeCourseColorScheme('new'), 'new');
});

test('deleting after damaged data backs up the original raw text before changing the saved list', async () => {
  const storage = createStorage();
  const raw = JSON.stringify([scheme('delete-me'), scheme('keep-me'), scheme('invalid', ['red'])]);
  storage.values.set(customStorageKey, raw);
  const { registry } = createRegistry(storage);
  await registry.loadCourseColorSchemes();
  await registry.deleteCourseColorScheme('delete-me');
  same(
    storage.writes.map(write => write.key),
    [recoveryStorageKey, customStorageKey],
  );
  assert.equal(storage.values.get(recoveryStorageKey), raw);
  same(JSON.parse(storage.values.get(customStorageKey)), [scheme('keep-me')]);
  assert.equal(registry.getCourseColorSchemeLoadWarning(), '');
  await importScheme(registry, scheme('after-delete'));
  assert.equal(storage.writes.filter(write => write.key === recoveryStorageKey).length, 1);
  assert.equal(storage.values.get(recoveryStorageKey), raw);
});

test('a deletion with a failed recovery backup preserves the original storage and visible palette', async () => {
  const storage = createStorage();
  const raw = JSON.stringify([scheme('keep-until-backup'), scheme('invalid', ['red'])]);
  storage.values.set(customStorageKey, raw);
  const { registry } = createRegistry(storage);
  await registry.loadCourseColorSchemes();
  const snapshot = registry.getCourseColorSchemes();
  storage.hooks.write = async key => {
    if (key === recoveryStorageKey) throw Error('backup unavailable');
  };
  await assert.rejects(registry.deleteCourseColorScheme('keep-until-backup'));
  assert.equal(registry.getCourseColorSchemes(), snapshot);
  assert.equal(storage.values.get(customStorageKey), raw);
  assert.equal(storage.writes.length, 0);
  assert.ok(registry.getCourseColorSchemeLoadWarning());
  storage.hooks.write = null;
  await registry.deleteCourseColorScheme('keep-until-backup');
  assert.equal(storage.values.get(recoveryStorageKey), raw);
  same(JSON.parse(storage.values.get(customStorageKey)), []);
  assert.equal(registry.getCourseColorSchemeLoadWarning(), '');
});

function createColors(registry) {
  const display = compile('utils/course-color-display.ts');
  return compile('utils/random-color.ts', {
    '@/lib/course-color-schemes': registry,
    '@/utils/course-color-display': display,
    './course-color-display': display,
  });
}

test('25-color palettes cycle after 25 courses without black fallback and retain existing allocations', async () => {
  const { registry } = createRegistry();
  const palette = colorsWith('#111111', '#222222');
  await importScheme(registry, scheme('cycling', palette));
  const colors = createColors(registry);
  const results = Array.from({ length: 53 }, (_, i) =>
    colors.allocateColorForCourse(`course-${i}`, 'student-a', 'cycling'),
  );
  same(
    results,
    Array.from({ length: 53 }, (_, i) => palette[i % palette.length]),
  );
  assert.equal(colors.allocateColorForCourse('course-0', 'student-a', 'cycling'), results[0]);
  assert.ok(!results.includes('#000000'));
});

test('allocations and resets are isolated by both student and palette', async () => {
  const { registry } = createRegistry();
  await importScheme(registry, scheme('two', colorsWith('#111111', '#222222')));
  await importScheme(registry, scheme('other', colorsWith('#333333', '#444444')));
  const colors = createColors(registry);
  assert.equal(colors.allocateColorForCourse('first', 'a', 'two'), '#111111');
  assert.equal(colors.allocateColorForCourse('second', 'a', 'two'), '#222222');
  assert.equal(colors.allocateColorForCourse('first', 'b', 'two'), '#111111');
  assert.equal(colors.allocateColorForCourse('first', 'a', 'other'), '#333333');
  assert.equal(colors.allocateColorForCourse('second', 'a', 'other'), '#444444');
  colors.clearColorMapping('a', 'two');
  assert.equal(colors.allocateColorForCourse('second', 'a', 'two'), '#111111');
  assert.equal(colors.allocateColorForCourse('second', 'b', 'two'), '#222222');
  assert.equal(colors.allocateColorForCourse('second', 'a', 'other'), '#444444');
  assert.equal(colors.getExamColor(), '#FF6347');
});

function createCourseHarness(storage, registry, dependencies = {}) {
  const colors = createColors(registry);
  const dayjs = () => ({ format: () => 'fixed-time', toISOString: () => 'fixed-time' });
  dayjs.extend = () => {};
  dayjs.locale = () => {};
  const forbidden = () => {
    throw Error('Network or native side effects are forbidden');
  };
  const course = compile('lib/course.ts', {
    '@/api/generate': {
      getApiV1JwchClassroomExam: forbidden,
      getApiV1TermsList: forbidden,
      getApiV2JwchCourseList: forbidden,
    },
    '@/components/query-provider': { queryClient: { getQueryData: () => undefined } },
    '@/lib/constants': constants,
    '@/lib/course-color-schemes': registry,
    '@/modules/native-widget': { setWidgetData: forbidden },
    '@/utils/fetch-with-cache': { fetchWithCache: forbidden },
    '@/utils/random-color': colors,
    '@bacons/apple-targets': {
      ExtensionStorage: class {
        constructor() {
          forbidden();
        }
      },
    },
    '@react-native-async-storage/async-storage': storage,
    dayjs,
    'dayjs/plugin/isBetween': () => {},
    'dayjs/plugin/isoWeek': () => {},
    'expo-constants': {},
    'object-hash': value => JSON.stringify(value),
    'react-native': { Platform: { OS: 'test' } },
    './exam-room': { formatExamData: value => value },
    './locate-date': {
      __esModule: true,
      default: forbidden,
      deConvertSemester: value => value,
      getWeeksBySemester: () => 20,
    },
    './user': { LocalUser: { getUser: () => ({ userid: 'student-a' }) }, USER_TYPE_POSTGRADUATE: 'postgraduate' },
    ...dependencies,
  });
  return course;
}

test('a delayed course refresh uses the latest exam export setting', async t => {
  for (const enabled of [false, true]) {
    await t.test(enabled ? 'enabled during refresh' : 'disabled during refresh', async () => {
      const { registry, storage } = createRegistry();
      storage.values.set(
        constants.COURSE_SETTINGS_KEY,
        JSON.stringify({ selectedSemester: '202601', exportExamToCourseTable: !enabled }),
      );
      let enteredFetch;
      let releaseFetch;
      const entered = new Promise(resolve => {
        enteredFetch = resolve;
      });
      const barrier = new Promise(resolve => {
        releaseFetch = resolve;
      });
      let examRequests = 0;
      const course = createCourseHarness(storage, registry, {
        '@/utils/fetch-with-cache': {
          fetchWithCache: async ([key]) => {
            if (key === constants.COURSE_DATA_V2_KEY) {
              enteredFetch();
              await barrier;
              return { data: { data: { courses: [], custom_courses: [] } } };
            }
            if (key === constants.EXAM_ROOM_KEY) {
              examRequests++;
              return [];
            }
            assert.equal(key, constants.COURSE_TERMS_LIST_KEY);
            return { data: { data: { terms: [] } } };
          },
        },
        './locate-date': { __esModule: true, default: async () => {} },
      });
      const pending = course.forceRefreshCourseDataWithCustomSync('202601', async () => {});
      await entered;
      await course.updateCourseSetting({ exportExamToCourseTable: enabled });
      releaseFetch();
      await pending;
      assert.equal(examRequests, enabled ? 1 : 0);
    });
  }
});

test('switching schemes recolors all 25 normal slots while preserving custom and exam colors', async () => {
  const { registry, storage } = createRegistry();
  const palette = colorsWith('#111111', '#222222');
  await importScheme(registry, scheme('replacement', palette));
  const course = createCourseHarness(storage, registry);
  const cache = course.CourseCache;
  const ordinary = currentColors.old.map((color, i) => ({
    id: i,
    name: `Normal ${i}`,
    type: course.COURSE_TYPE,
    color,
  }));
  cache.isLoaded = true;
  cache.cachedData = { 0: ordinary };
  cache.cachedExamData = { 0: [{ id: 100, type: course.EXAM_TYPE, color: '#FF6347' }] };
  cache.cachedCustomData = { 0: [{ id: 101, type: course.CUSTOM_TYPE, color: '#ABCDEF', storageKey: 'cloud-id' }] };
  const examBefore = clone(cache.cachedExamData);
  const customBefore = clone(cache.cachedCustomData);
  await cache.applyColorScheme('replacement');
  same(
    cache.cachedData[0].map(item => item.color),
    palette,
  );
  same(
    cache.cachedData[0].map(item => item.id),
    ordinary.map(item => item.id),
  );
  same(cache.cachedExamData, examBefore);
  same(cache.cachedCustomData, customBefore);
  const saved = JSON.parse(storage.values.get(constants.COURSE_CURRENT_CACHE_KEY));
  assert.equal(saved.colorScheme, 'replacement');
  assert.ok(saved.courseData[0].every(item => /^#[0-9A-F]{6}$/.test(item.color)));
});

test('restart hydrates custom schemes before reading settings and normalizing cached colors', async () => {
  const { registry, storage } = createRegistry();
  await importScheme(registry, scheme('saved', colorsWith('#101010', '#202020', '#303030')));
  storage.values.set(
    constants.COURSE_SETTINGS_KEY,
    JSON.stringify({ colorScheme: 'saved', selectedSemester: '202601' }),
  );
  storage.values.set(
    constants.COURSE_CURRENT_CACHE_KEY,
    JSON.stringify({
      colorScheme: 'saved',
      courseData: { 0: [{ id: 1, type: 0, name: 'Saved course', color: '#303030' }] },
      courseDigest: 'digest',
      examData: {},
      customData: {},
      priorityCounter: 1,
    }),
  );
  const restarted = createRegistry(storage).registry;
  const course = createCourseHarness(storage, restarted);
  await course.CourseCache.load();
  assert.equal((await course.getCourseSetting()).colorScheme, 'saved');
  assert.equal(course.CourseCache.colorScheme, 'saved');
  assert.equal(course.CourseCache.cachedData[0][0].color, '#303030');
  assert.equal(storage.writes.length, 1, 'An unchanged restored palette must not recolor and rewrite cache');

  const settingsFirst = createCourseHarness(storage, createRegistry(storage).registry);
  assert.equal((await settingsFirst.getCourseSetting()).colorScheme, 'saved');
});

test('a removed palette falls back using saved color indices and persists valid classic colors', async () => {
  const { registry, storage } = createRegistry();
  storage.values.set(constants.COURSE_SETTINGS_KEY, JSON.stringify({ colorScheme: 'removed' }));
  storage.values.set(
    constants.COURSE_CURRENT_CACHE_KEY,
    JSON.stringify({
      colorScheme: 'removed',
      paletteColors: ['#121212', '#343434'],
      courseData: {
        0: [
          { id: 1, type: 0, name: 'Second color', color: '#343434' },
          { id: 2, type: 0, name: 'First color', color: '#121212' },
        ],
      },
      examData: {},
      customData: {},
    }),
  );
  const course = createCourseHarness(storage, registry);
  await course.CourseCache.load();
  same(
    course.CourseCache.cachedData[0].map(item => item.color),
    [currentColors.old[1], currentColors.old[0]],
  );
  const saved = JSON.parse(storage.values.get(constants.COURSE_CURRENT_CACHE_KEY));
  assert.equal(saved.colorScheme, 'old');
  same(saved.paletteColors, currentColors.old);
});

test('a palette file updated under the same id migrates cached colors using its prior snapshot', async () => {
  const { registry, storage } = createRegistry();
  storage.values.set(constants.COURSE_SETTINGS_KEY, JSON.stringify({ colorScheme: 'waterforest' }));
  storage.values.set(
    constants.COURSE_CURRENT_CACHE_KEY,
    JSON.stringify({
      colorScheme: 'waterforest',
      paletteColors: ['#121212', '#343434'],
      courseData: { 0: [{ id: 1, type: 0, name: 'Second color', color: '#343434' }] },
      examData: {},
      customData: {},
    }),
  );
  const course = createCourseHarness(storage, registry);
  await course.CourseCache.load();
  assert.equal(course.CourseCache.cachedData[0][0].color, currentColors.waterforest[1]);
  const saved = JSON.parse(storage.values.get(constants.COURSE_CURRENT_CACHE_KEY));
  assert.equal(saved.colorScheme, 'waterforest');
  same(saved.paletteColors, currentColors.waterforest);
});

test('legacy caches without a scheme or color snapshot retain their classic colors', async () => {
  const { registry, storage } = createRegistry();
  storage.values.set(
    constants.COURSE_CURRENT_CACHE_KEY,
    JSON.stringify({
      courseData: { 0: [{ id: 1, type: 0, name: 'Legacy course', color: currentColors.old[17] }] },
      examData: {},
      customData: {},
    }),
  );
  const course = createCourseHarness(storage, registry);
  await course.CourseCache.load();
  assert.equal(course.CourseCache.cachedData[0][0].color, currentColors.old[17]);
  assert.equal(storage.writes.length, 0);
});
