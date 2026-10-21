// Offline display checks. Expectations use independent sRGB -> XYZ -> OKLab math;
// no conversion or scoring helper is imported from the implementation under test.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '../..');
const assetsDirectory = path.join(root, 'assets/course-color-schemes');
const definitions = fs
  .readdirSync(assetsDirectory)
  .filter(name => name.endsWith('.json'))
  .map(name => JSON.parse(fs.readFileSync(path.join(assetsDirectory, name), 'utf8')));
const allColors = definitions.flatMap(definition => definition.colors);

function compile(relativePath, dependencies = {}, requireContext) {
  const filename = path.join(root, relativePath);
  const result = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    fileName: filename,
    reportDiagnostics: true,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  });
  assert.equal((result.diagnostics || []).filter(item => item.category === ts.DiagnosticCategory.Error).length, 0);
  const module = { exports: {} };
  const localRequire = name => {
    assert.ok(Object.hasOwn(dependencies, name), `Unmocked dependency: ${relativePath} -> ${name}`);
    return dependencies[name];
  };
  localRequire.context = requireContext;
  new vm.Script(result.outputText, { filename }).runInNewContext({
    module,
    exports: module.exports,
    require: localRequire,
    console: { log() {}, warn() {}, error() {} },
  });
  return module.exports;
}

const display = compile('utils/course-color-display.ts');
const getDisplay = display.getCourseDisplayColor;
const bytes = color => [1, 3, 5].map(start => Number.parseInt(color.slice(start, start + 2), 16));
const multiply = (matrix, vector) =>
  matrix.map(row => row.reduce((sum, value, index) => sum + value * vector[index], 0));

// Reference matrices and sRGB transfer function from W3C CSS Color 4, section 19:
// https://www.w3.org/TR/css-color-4/#color-conversion-code
// Keep the XYZ intermediate: production uses a combined sRGB/LMS path.
function xyzToLab(xyz) {
  const lms = multiply(
    [
      [0.819022437996703, 0.3619062600528904, -0.1288737815209879],
      [0.0329836539323885, 0.9292868615863434, 0.0361446663506424],
      [0.0481771893596242, 0.2642395317527308, 0.6335478284694309],
    ],
    xyz,
  ).map(Math.cbrt);
  return multiply(
    [
      [0.210454268309314, 0.7936177747023054, -0.0040720430116193],
      [1.9779985324311684, -2.4285922420485799, 0.450593709617411],
      [0.0259040424655478, 0.7827717124575296, -0.8086757549230774],
    ],
    lms,
  );
}

function toLab(rgb) {
  const linear = rgb.map(byte => {
    const channel = byte / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return xyzToLab(
    multiply(
      [
        [506752 / 1228815, 87881 / 245763, 12673 / 70218],
        [87098 / 409605, 175762 / 245763, 12673 / 175545],
        [7918 / 409605, 87881 / 737289, 1001167 / 1053270],
      ],
      linear,
    ),
  );
}

const delta = (left, right) => Math.hypot(...left.map((value, index) => value - right[index]));
const chroma = lab => Math.hypot(lab[1], lab[2]);
const hueDifference = (left, right) => {
  const difference = Math.abs(((Math.atan2(left[2], left[1]) - Math.atan2(right[2], right[1])) * 180) / Math.PI);
  return Math.min(difference, 360 - difference);
};
const composite = (foreground, background) =>
  foreground.map((channel, index) => channel * 0.75 + background[index] * 0.25);

function rgba(value) {
  const match = /^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(0\.75)\s*\)$/.exec(value);
  assert.ok(match, `Expected integer RGB channels and exact 0.75 alpha: ${value}`);
  const channels = match.slice(1, 4).map(Number);
  assert.ok(channels.every(channel => Number.isFinite(channel) && channel >= 0 && channel <= 255));
  assert.equal(Number(match[4]), 0.75);
  return channels;
}

function createRegistryAndColors() {
  const values = new Map();
  const writes = [];
  const registry = compile(
    'lib/course-color-schemes.ts',
    {
      '@react-native-async-storage/async-storage': {
        async getItem(key) {
          return values.get(key) ?? null;
        },
        async setItem(key, value) {
          values.set(key, value);
          writes.push({ key, value });
        },
      },
    },
    (_directory, _recursive, filter) => {
      const keys = fs
        .readdirSync(assetsDirectory)
        .map(name => `./${name}`)
        .filter(name => filter.test(name));
      const context = name => JSON.parse(fs.readFileSync(path.join(assetsDirectory, name.slice(2)), 'utf8'));
      context.keys = () => keys;
      return context;
    },
  );
  const colors = compile('utils/random-color.ts', {
    '@/lib/course-color-schemes': registry,
    '@/utils/course-color-display': display,
    './course-color-display': display,
  });
  return { registry, colors, values, writes };
}

test('independent reference conversion agrees with published XYZ/OKLab examples and neutral endpoints', () => {
  // Rounded example pairs published by OKLab's author:
  // https://bottosson.github.io/posts/oklab/#converting-from-xyz-to-oklab
  for (const [xyz, expected] of [
    [
      [0.95, 1, 1.089],
      [1, 0, 0],
    ],
    [
      [1, 0, 0],
      [0.45, 1.236, -0.019],
    ],
    [
      [0, 1, 0],
      [0.922, -0.671, 0.263],
    ],
    [
      [0, 0, 1],
      [0.153, -1.415, -0.449],
    ],
  ])
    assert.ok(delta(xyzToLab(xyz), expected) < 0.002);
  assert.ok(delta(toLab([0, 0, 0]), [0, 0, 0]) < 1e-12);
  assert.ok(delta(toLab([255, 255, 255]), [1, 0, 0]) < 1e-7);
});

test('both themes use exactly 75 percent opacity; disabling compensation preserves every input channel', () => {
  for (const color of [...allColors, '#000000', '#FFFFFF', '#aBcDeF']) {
    for (const dark of [false, true]) {
      rgba(getDisplay(color, dark));
      assert.deepEqual(rgba(getDisplay(color, dark, { compensate: false })), bytes(color));
      assert.deepEqual(
        rgba(getDisplay(color, dark, { hasCustomBackground: true, darkenBackground: true, compensate: false })),
        bytes(color),
      );
    }
  }
});

test('non-six-digit and invalid colors pass through unchanged instead of being reinterpreted', () => {
  for (const color of [
    '',
    'red',
    'transparent',
    '#FFF',
    '#12345678',
    '#GG0000',
    '#12345G',
    'rgb(1,2,3)',
    ' #123456',
    '#123456 ',
    '#123456\n',
  ]) {
    for (const dark of [false, true]) assert.equal(getDisplay(color, dark), color);
  }
});

test('neutral grays stay neutral and channel extremes always produce finite in-gamut rgba colors', () => {
  const extremes = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#000001', '#FFFEFF'];
  for (const value of [0, 1, 16, 64, 127, 128, 192, 254, 255]) {
    extremes.push(`#${value.toString(16).padStart(2, '0').repeat(3)}`);
  }
  for (const color of extremes) {
    for (const dark of [false, true]) {
      for (const options of [
        {},
        { hasCustomBackground: true },
        { hasCustomBackground: true, darkenBackground: true },
      ]) {
        const actual = rgba(getDisplay(color, dark, options));
        if (new Set(bytes(color)).size === 1)
          assert.equal(new Set(actual).size, 1, `Neutral color acquired a tint: ${color}`);
      }
    }
  }
});

test('every current palette improves or preserves composited OKLab distance in each solid theme', t => {
  for (const definition of definitions) {
    assert.equal(definition.colors.length, 25);
    for (const dark of [false, true]) {
      const background = bytes(dark ? '#121212' : '#F7F7F7');
      let baselineSum = 0;
      let compensatedSum = 0;
      let improved = 0;
      for (const color of definition.colors) {
        const original = bytes(color);
        const target = toLab(original);
        const baselineError = delta(toLab(composite(original, background)), target);
        const resultError = delta(toLab(composite(rgba(getDisplay(color, dark)), background)), target);
        assert.ok(
          resultError <= baselineError + 1e-6,
          `${definition.id} ${dark ? 'dark' : 'light'} ${color}: ${resultError} > ${baselineError}`,
        );
        baselineSum += baselineError;
        compensatedSum += resultError;
        if (resultError < baselineError - 1e-4) improved++;
      }
      assert.ok(improved > 0, `${definition.id} never benefits from compensation`);
      assert.ok(compensatedSum < baselineSum, `${definition.id} aggregate appearance did not improve`);
      t.diagnostic(
        `${definition.id} ${dark ? 'dark' : 'light'} mean ΔEOK ${(baselineSum / 25).toFixed(5)} -> ${(compensatedSum / 25).toFixed(5)}; ${improved}/25 improved`,
      );
    }
  }
});

test('chromatic palette hues remain close after compensation, allowing for 8-bit quantization', t => {
  let maximumHueDifference = 0;
  for (const color of allColors) {
    const source = toLab(bytes(color));
    if (chroma(source) < 0.03) continue; // Hue is unstable near neutral gray.
    for (const dark of [false, true]) {
      const output = toLab(rgba(getDisplay(color, dark)));
      if (chroma(output) < 0.03) continue; // Gamut reduction can make hue visually powerless.
      const difference = hueDifference(source, output);
      maximumHueDifference = Math.max(maximumHueDifference, difference);
      assert.ok(difference <= 3, `${color} changed hue by ${difference} degrees`);
    }
  }
  t.diagnostic(`Maximum foreground hue drift for chromatic built-ins: ${maximumHueDifference.toFixed(3)} degrees`);
});

test('wallpaper compensation uses a theme-independent neutral reference with bounded lightness and chroma changes', () => {
  for (const darkenBackground of [false, true]) {
    const options = Object.freeze({ hasCustomBackground: true, darkenBackground });
    const gray = 128 * (darkenBackground ? 1 - 80 / 255 : 1);
    const background = [gray, gray, gray];
    for (const color of allColors) {
      assert.equal(getDisplay(color, false, options), getDisplay(color, true, options));
      const original = bytes(color);
      const originalLab = toLab(original);
      const output = rgba(getDisplay(color, false, options));
      const outputLab = toLab(output);
      const baselineError = delta(toLab(composite(original, background)), originalLab);
      const resultError = delta(toLab(composite(output, background)), originalLab);
      assert.ok(resultError <= baselineError + 1e-6, `${color} worsens over the wallpaper reference`);
      // The contract limits wallpaper search to 25% of the solid-background amplitude.
      // 0.002 accounts for final quantization of RGB channels to bytes.
      assert.ok(Math.abs(outputLab[0] - originalLab[0]) <= 0.032, `${color} exceeds wallpaper lightness bound`);
      assert.ok(
        chroma(outputLab) - chroma(originalLab) <= Math.min(0.01, 0.0875 * chroma(originalLab)) + 0.002,
        `${color} exceeds wallpaper chroma-increase bound`,
      );
    }
  }
});

test('memoized outputs remain correct across theme, wallpaper, darkening, and compensation switches', () => {
  const cases = [];
  for (const dark of [false, true]) {
    for (const options of [
      {},
      { hasCustomBackground: true },
      { hasCustomBackground: true, darkenBackground: true },
      { compensate: false },
    ]) {
      const isolated = compile('utils/course-color-display.ts');
      const color = '#7A6068';
      cases.push({
        color,
        dark,
        options: Object.freeze(options),
        expected: isolated.getCourseDisplayColor(color, dark, options),
      });
    }
  }
  for (let iteration = 0; iteration < 3; iteration++) {
    for (const sample of iteration % 2 ? [...cases].reverse() : cases) {
      assert.equal(getDisplay(sample.color, sample.dark, sample.options), sample.expected);
      assert.equal(getDisplay(sample.color.toLowerCase(), sample.dark, sample.options), sample.expected);
    }
  }
  assert.notEqual(
    cases[0].expected,
    cases[4].expected,
    'Solid light and dark modes must not share a stale cache entry',
  );
});

test('the public wrapper preserves non-current-week gray and text rules without mutating stored source colors', async () => {
  const { registry, colors, values, writes } = createRegistryAndColors();
  await registry.loadCourseColorSchemes();
  const snapshot = registry.getCourseColorSchemes();
  const definitionsBefore = JSON.stringify(snapshot);
  const cachedCourses = Object.freeze({
    colorScheme: 'old',
    courseData: Object.freeze(allColors.map((color, id) => Object.freeze({ id, color }))),
  });
  const cacheBefore = JSON.stringify(cachedCourses);
  values.set('course-cache-fixture', cacheBefore);
  const allocated = colors.allocateColorForCourse('fixed-course', 'student-display-test', 'old');
  for (const dark of [false, true]) {
    for (const options of [{}, { hasCustomBackground: true }, { hasCustomBackground: true, darkenBackground: true }]) {
      for (const course of cachedCourses.courseData)
        assert.equal(colors.getCourseColor(course.color, dark, options), getDisplay(course.color, dark, options));
      for (const gray of ['#DEDEDE', '#dedede'])
        assert.deepEqual(rgba(colors.getCourseColor(gray, dark, options)), [222, 222, 222]);
    }
    assert.equal(colors.getTextColor('#DEDEDE', dark), '#00000033');
    assert.equal(colors.getTextColor('#7A6068', dark), dark ? '#FFFFFFDE' : '#FFFFFF');
  }
  assert.equal(colors.allocateColorForCourse('fixed-course', 'student-display-test', 'old'), allocated);
  assert.equal(registry.getCourseColorSchemes(), snapshot);
  assert.equal(JSON.stringify(snapshot), definitionsBefore);
  assert.equal(JSON.stringify(cachedCourses), cacheBefore);
  assert.equal(values.get('course-cache-fixture'), cacheBefore);
  assert.equal(writes.length, 0);
});
