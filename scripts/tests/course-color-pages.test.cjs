// Exercise the actual page components and JSON registry without touching native app storage.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const React = require('react');
const { act, create } = require('react-test-renderer');
const ts = require('typescript');

global.IS_REACT_ACT_ENVIRONMENT = true;
const root = path.resolve(__dirname, '../..');
const operationModules = new WeakMap();

function compile(relativePath, dependencies, requireContext, exposedComponent) {
  const filename = path.join(root, relativePath);
  const source = fs.readFileSync(filename, 'utf8');
  const result = ts.transpileModule(source + (exposedComponent ? `\nexport { ${exposedComponent} };` : ''), {
    fileName: filename,
    reportDiagnostics: true,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  });
  assert.equal(
    (result.diagnostics || []).filter(item => item.category === ts.DiagnosticCategory.Error).length,
    0,
    `Cannot transpile ${relativePath}`,
  );
  const module = { exports: {} };
  const localRequire = name => {
    if (name.endsWith('.svg')) return 'SvgIcon';
    assert.ok(Object.hasOwn(dependencies, name), `Unmocked dependency: ${relativePath} -> ${name}`);
    return dependencies[name];
  };
  localRequire.context = requireContext;
  new vm.Script(result.outputText, { filename }).runInNewContext({
    module,
    exports: module.exports,
    require: localRequire,
    console,
    Error,
  });
  return module.exports;
}

function textOf(node) {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  return (node?.children || []).map(textOf).join('');
}

function createHarness(shared = {}) {
  const state = shared.state || {
    colorScheme: 'old',
    loadError: null,
    saveError: null,
    saveGate: null,
    invalidateError: null,
    events: [],
    successes: [],
  };
  const constants = compile('lib/constants.ts', {});
  const registry =
    shared.registry ||
    compile('lib/course-color-schemes.ts', {}, (directory, recursive, filter) => {
      assert.equal(directory, '../assets/course-color-schemes');
      assert.equal(recursive, false);
      const directoryPath = path.join(root, 'assets/course-color-schemes');
      const keys = fs
        .readdirSync(directoryPath)
        .map(filename => `./${filename}`)
        .filter(key => filter.test(key));
      const context = key => JSON.parse(fs.readFileSync(path.join(directoryPath, key.slice(2)), 'utf8'));
      context.keys = () => keys;
      return context;
    });
  let operations = operationModules.get(registry);
  if (!operations) {
    operations = compile('lib/course-color-operations.ts', {});
    operationModules.set(registry, operations);
  }
  const focus = { focused: true, callback: null, cleanup: null };
  const dependencies = {
    react: React,
    'react/jsx-runtime': require('react/jsx-runtime'),
    'react-native': { View: 'View', Pressable: 'Pressable', ActivityIndicator: 'ActivityIndicator' },
    'react-native-gesture-handler': { ScrollView: 'ScrollView' },
    'react-native-safe-area-context': { SafeAreaView: 'SafeAreaView' },
    'expo-router': {
      Stack: { Screen: 'Screen' },
      useFocusEffect(callback) {
        React.useEffect(() => {
          focus.callback = callback;
          if (focus.focused) focus.cleanup = callback();
          return () => {
            focus.cleanup?.();
            focus.cleanup = null;
            focus.callback = null;
          };
        }, [callback]);
      },
    },
    'sonner-native': { toast: { success: message => state.successes.push(message) } },
    '@/components/page-container': 'PageContainer',
    '@/components/ui/button': { Button: 'Button' },
    '@/components/ui/text': { Text: 'Text' },
    '@/components/query-provider': {
      queryClient: {
        async invalidateQueries(options) {
          state.events.push(['invalidate', options.queryKey[0]]);
          if (state.invalidateError) throw state.invalidateError;
        },
      },
    },
    '@/lib/course': {
      CourseCache: {
        async load() {
          if (state.loadError) throw state.loadError;
        },
      },
      async getCourseSetting() {
        return { colorScheme: state.colorScheme };
      },
      async updateCourseSetting(settings) {
        state.events.push(['save', settings.colorScheme]);
        if (state.saveGate) await state.saveGate;
        if (state.saveError) throw state.saveError;
        state.colorScheme = settings.colorScheme;
      },
    },
    '@/lib/constants': constants,
    '@/lib/course-color-schemes': registry,
    '@/lib/course-color-operations': operations,
    '@/lib/utils': { cn: (...classes) => classes.filter(Boolean).join(' ') },
  };
  dependencies['@/components/course/color-palette-preview'] = compile(
    'components/course/color-palette-preview.tsx',
    dependencies,
  );
  let renderer;
  return {
    state,
    registry,
    async mount(t) {
      const Page = compile('app/settings/course-colors.tsx', dependencies).default;
      await act(async () => {
        renderer = create(React.createElement(Page));
      });
      t.after(async () => act(async () => renderer.unmount()));
    },
    text: () => textOf(renderer.root),
    nodes: type => renderer.root.findAllByType(type),
    button: label => renderer.root.findAllByType('Button').find(button => textOf(button) === label),
    radio: id =>
      renderer.root
        .findAllByType('Pressable')
        .find(
          item =>
            item.props.accessibilityRole === 'radio' &&
            item.props.accessibilityLabel === registry.getCourseColorScheme(id).name,
        ),
    radios: () => renderer.root.findAllByType('Pressable').filter(item => item.props.accessibilityRole === 'radio'),
    async blur() {
      await act(async () => {
        focus.focused = false;
        focus.cleanup?.();
        focus.cleanup = null;
      });
    },
  };
}

test('the palette page lists only built-in choices and restores the selected scheme', async t => {
  const page = createHarness();
  page.state.colorScheme = 'waterforest';
  await page.mount(t);
  assert.equal(page.radios().length, page.registry.getCourseColorSchemes().length);
  assert.equal(page.nodes('Pressable').length, page.radios().length);
  assert.equal(page.nodes('Modal').length, 0);
  assert.equal(page.radio('waterforest').props.accessibilityState.selected, true);
  for (const radio of page.radios()) {
    assert.equal(radio.props.accessibilityActions, undefined);
    assert.equal(radio.props.onAccessibilityAction, undefined);
  }
});

test('selecting a built-in palette persists, refreshes the schedule and ignores repeat selection', async t => {
  const page = createHarness();
  await page.mount(t);
  await act(async () => page.radio('mountain').props.onPress());
  assert.equal(page.state.colorScheme, 'mountain');
  assert.equal(page.radio('mountain').props.accessibilityState.selected, true);
  assert.ok(page.state.events.some(([event]) => event === 'invalidate'));
  assert.equal(page.state.successes.length, 1);
  await act(async () => page.radio('mountain').props.onPress());
  assert.equal(page.state.events.filter(([event]) => event === 'save').length, 1);
});

test('selection failure preserves the previous choice and allows retry', async t => {
  const page = createHarness();
  await page.mount(t);
  page.state.saveError = Error('storage unavailable');
  await act(async () => page.radio('mountain').props.onPress());
  assert.equal(page.state.colorScheme, 'old');
  assert.equal(page.radio('old').props.accessibilityState.selected, true);
  assert.match(page.text(), /切换配色失败/);
  page.state.saveError = null;
  await act(async () => page.radio('mountain').props.onPress());
  assert.equal(page.state.colorScheme, 'mountain');
  assert.equal(page.radio('mountain').props.disabled, false);
});

test('refresh failure reports a saved selection without reverting it', async t => {
  const page = createHarness();
  page.state.invalidateError = Error('refresh failed');
  await page.mount(t);
  await act(async () => page.radio('mountain').props.onPress());
  assert.equal(page.state.colorScheme, 'mountain');
  assert.equal(page.radio('mountain').props.accessibilityState.selected, true);
  assert.match(page.text(), /配色已保存，课表刷新失败/);
});

test('a failed settings load can be retried', async t => {
  const page = createHarness();
  page.state.loadError = Error('storage unavailable');
  await page.mount(t);
  assert.match(page.text(), /读取课程配色失败/);
  assert.equal(page.radios().length, 0);
  page.state.loadError = null;
  await act(async () => page.button('重试').props.onPress());
  assert.equal(page.radios().length, page.registry.getCourseColorSchemes().length);
});

test('a pending selection blocks duplicate writes across navigation and synchronizes the new page', async t => {
  const page = createHarness();
  await page.mount(t);
  let release;
  page.state.saveGate = new Promise(resolve => {
    release = resolve;
  });
  let pending;
  await act(async () => {
    pending = page.radio('mountain').props.onPress();
  });
  assert.ok(page.radios().every(radio => radio.props.disabled));
  await page.blur();
  const next = createHarness({ state: page.state, registry: page.registry });
  await next.mount(t);
  assert.ok(next.radios().every(radio => radio.props.disabled));
  await act(async () => next.radio('waterforest').props.onPress());
  assert.equal(page.state.events.filter(([event]) => event === 'save').length, 1);
  await act(async () => {
    release();
    await pending;
  });
  assert.equal(next.radio('mountain').props.accessibilityState.selected, true);
  assert.ok(next.radios().every(radio => !radio.props.disabled));
});

test('an already mounted friend grid updates when the built-in scheme changes without refetching courses', async t => {
  const page = createHarness();
  const friendCourses = [{ name: '测试课程' }];
  let processCount = 0;
  const dependencies = Object.fromEntries(
    [
      'expo-router',
      'react-native-gesture-handler',
      'sonner-native',
      '@/api/generate',
      '@/components/Icon',
      '@/components/app-theme-provider',
      '@/components/course/course-error-boundary',
      '@/components/course/friend-list-modal',
      '@/components/loading',
      '@/components/multistateview/error-view',
      '@/components/page-container',
      '@/components/picker-modal',
      '@/components/query-provider',
      '@/components/ui/text',
      '@/context/course-page',
      '@/hooks/useCourseDataSuspense',
      '@/hooks/useRefreshCourseTable',
      '@/lib/constants',
      '@/lib/notification',
    ].map(name => [name, {}]),
  );
  Object.assign(dependencies, {
    react: React,
    'react/jsx-runtime': require('react/jsx-runtime'),
    'react-native': { FlatList: 'FlatList', useWindowDimensions: () => ({ width: 400, height: 800 }) },
    '@/components/course/course-week': 'CourseWeek',
    '@/hooks/useApiRequest': () => ({ data: friendCourses, isError: false }),
    '@/hooks/useSafeResponseSolve': { useSafeResponseSolve: () => ({ handleError() {} }) },
    '@/lib/course-schedule': { mergeCourseSchedulesByDay: schedules => schedules },
    '@/lib/locate-date': { getFirstDateByWeek: () => '2026-09-01' },
    '@/lib/course': {
      CourseCache: {
        processFriendCourses(courses, friendId, scheme) {
          assert.equal(courses, friendCourses);
          assert.equal(friendId, 'friend');
          processCount++;
          return { 0: [{ name: '测试课程', color: page.registry.getCourseColors(scheme)[0] }] };
        },
      },
    },
  });
  const { CourseGrid } = compile('app/(tabs)/index.tsx', dependencies, undefined, 'CourseGrid');
  const props = {
    selectedFriendId: 'friend',
    selectedWeek: 1,
    onWeekChange() {},
    coursePageData: {
      setting: { selectedSemester: '202601', colorScheme: 'old' },
      currentTerm: { start_date: '2026-09-01' },
      maxWeek: 1,
      schedulesByDays: {},
    },
  };
  let renderer;
  await act(async () => {
    renderer = create(React.createElement(CourseGrid, props));
  });
  t.after(async () => act(async () => renderer.unmount()));
  const renderedColor = () =>
    renderer.root.findByType('FlatList').props.renderItem({ item: { week: 1, firstDate: '2026-09-01' } }).props
      .schedulesByDays[0][0].color;
  assert.equal(renderedColor(), page.registry.getCourseColors('old')[0]);
  assert.equal(processCount, 1);

  await act(async () => {
    renderer.update(
      React.createElement(CourseGrid, {
        ...props,
        coursePageData: {
          ...props.coursePageData,
          setting: { ...props.coursePageData.setting, colorScheme: 'mountain' },
        },
      }),
    );
  });
  assert.equal(renderedColor(), page.registry.getCourseColors('mountain')[0]);
  assert.equal(processCount, 2);
});
