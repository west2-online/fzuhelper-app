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
const clone = value => JSON.parse(JSON.stringify(value));
const same = (actual, expected) => assert.deepEqual(clone(actual), clone(expected));
const silentConsole = { log() {}, warn() {}, error() {} };

function compile(relativePath, dependencies = {}, requireContext) {
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

function createRegistry(storage = createStorage(), directory = assetsDirectory) {
  const calls = [];
  const registry = compile('lib/course-color-schemes.ts', {}, (requestedDirectory, recursive, filter) => {
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
  });
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

function createColors(registry) {
  const display = compile('utils/course-color-display.ts');
  return compile('utils/random-color.ts', {
    '@/lib/course-color-schemes': registry,
    '@/utils/course-color-display': display,
    './course-color-display': display,
  });
}

test('25-color palettes cycle after 25 courses without black fallback and retain existing allocations', () => {
  const { registry } = createRegistry();
  const palette = currentColors.old;
  const colors = createColors(registry);
  const results = Array.from({ length: 53 }, (_, i) =>
    colors.allocateColorForCourse(`course-${i}`, 'student-a', 'old'),
  );
  same(
    results,
    Array.from({ length: 53 }, (_, i) => palette[i % palette.length]),
  );
  assert.equal(colors.allocateColorForCourse('course-0', 'student-a', 'old'), results[0]);
  assert.ok(!results.includes('#000000'));
});

test('allocations and resets are isolated by both student and palette', () => {
  const { registry } = createRegistry();
  const colors = createColors(registry);
  assert.equal(colors.allocateColorForCourse('first', 'a', 'old'), currentColors.old[0]);
  assert.equal(colors.allocateColorForCourse('second', 'a', 'old'), currentColors.old[1]);
  assert.equal(colors.allocateColorForCourse('first', 'b', 'old'), currentColors.old[0]);
  assert.equal(colors.allocateColorForCourse('first', 'a', 'mountain'), currentColors.mountain[0]);
  assert.equal(colors.allocateColorForCourse('second', 'a', 'mountain'), currentColors.mountain[1]);
  colors.clearColorMapping('a', 'old');
  assert.equal(colors.allocateColorForCourse('second', 'a', 'old'), currentColors.old[0]);
  assert.equal(colors.allocateColorForCourse('second', 'b', 'old'), currentColors.old[1]);
  assert.equal(colors.allocateColorForCourse('second', 'a', 'mountain'), currentColors.mountain[1]);
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
  const palette = currentColors.waterforest;
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
  await cache.applyColorScheme('waterforest');
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
  assert.equal(saved.colorScheme, 'waterforest');
  assert.ok(saved.courseData[0].every(item => /^#[0-9A-F]{6}$/.test(item.color)));
});

test('restart restores the chosen built-in scheme without reallocating its cached colors', async () => {
  const { registry, storage } = createRegistry();
  storage.values.set(
    constants.COURSE_SETTINGS_KEY,
    JSON.stringify({ colorScheme: 'waterforest', selectedSemester: '202601' }),
  );
  storage.values.set(
    constants.COURSE_CURRENT_CACHE_KEY,
    JSON.stringify({
      colorScheme: 'waterforest',
      courseData: { 0: [{ id: 1, type: 0, name: 'Saved course', color: currentColors.waterforest[2] }] },
      courseDigest: 'digest',
      examData: {},
      customData: {},
      priorityCounter: 1,
    }),
  );
  const course = createCourseHarness(storage, registry);
  await course.CourseCache.load();
  assert.equal((await course.getCourseSetting()).colorScheme, 'waterforest');
  assert.equal(course.CourseCache.colorScheme, 'waterforest');
  assert.equal(course.CourseCache.cachedData[0][0].color, currentColors.waterforest[2]);
  assert.equal(storage.writes.length, 0);
});

test('existing client caches without a scheme retain their classic colors', async () => {
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

test('missing or invalid settings initialize classic colors and remain editable', async t => {
  const settings = [
    ['absent', null],
    ['no scheme', '{}'],
    ['unknown scheme', JSON.stringify({ colorScheme: 'missing' })],
    ['empty scheme', JSON.stringify({ colorScheme: '' })],
    ['null scheme', JSON.stringify({ colorScheme: null })],
    ['numeric scheme', JSON.stringify({ colorScheme: 42 })],
    ['object scheme', JSON.stringify({ colorScheme: {} })],
    ['malformed JSON', '{'],
    ['null settings', 'null'],
    ['array settings', '[]'],
    ['primitive settings', '42'],
  ];
  for (const [name, value] of settings) {
    await t.test(name, async () => {
      const { registry, storage } = createRegistry();
      if (value !== null) storage.values.set(constants.COURSE_SETTINGS_KEY, value);
      const course = createCourseHarness(storage, registry);
      assert.equal((await course.getCourseSetting()).colorScheme, 'old');
      await course.CourseCache.load();
      assert.equal(course.CourseCache.colorScheme, 'old');
      const colors = createColors(registry);
      assert.equal(
        colors.allocateColorForCourse('Initial course', 'student-a', (await course.getCourseSetting()).colorScheme),
        currentColors.old[0],
      );
      await course.updateCourseSetting({ colorScheme: 'mountain' });
      assert.equal((await course.getCourseSetting()).colorScheme, 'mountain');
    });
  }
});

test('invalid cache schemes and ordinary course colors initialize from the classic palette', async t => {
  for (const colorScheme of [undefined, null, '', 'missing', 42, {}]) {
    await t.test(String(colorScheme), async () => {
      const { registry, storage } = createRegistry();
      storage.values.set(constants.COURSE_SETTINGS_KEY, JSON.stringify({ colorScheme }));
      storage.values.set(
        constants.COURSE_CURRENT_CACHE_KEY,
        JSON.stringify({
          colorScheme,
          courseData: {
            0: [
              { id: 1, type: 0, name: 'Valid classic course', color: currentColors.old[17] },
              { id: 2, type: 0, name: 'Invalid course color', color: 'invalid' },
              { id: 3, type: 0, name: 'Missing course color' },
            ],
          },
          examData: { 0: [{ id: 4, type: 1, color: '#FF6347' }] },
          customData: { 0: [{ id: 5, type: 2, color: '#ABCDEF' }] },
        }),
      );
      const course = createCourseHarness(storage, registry);
      await course.CourseCache.load();
      assert.equal(course.CourseCache.colorScheme, 'old');
      assert.equal(course.CourseCache.cachedData[0][0].color, currentColors.old[17]);
      assert.ok(course.CourseCache.cachedData[0].every(item => currentColors.old.includes(item.color)));
      assert.equal(course.CourseCache.cachedExamData[0][0].color, '#FF6347');
      assert.equal(course.CourseCache.cachedCustomData[0][0].color, '#ABCDEF');
      assert.equal(JSON.parse(storage.values.get(constants.COURSE_CURRENT_CACHE_KEY)).colorScheme, 'old');
    });
  }
});
