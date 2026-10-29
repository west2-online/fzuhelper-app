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
const paletteColors = Array.from({ length: 25 }, (_, index) => `#${(index + 1).toString(16).padStart(6, '0')}`);
const customPalette = (id, name) => ({ id, name, colors: paletteColors });
const swatches = node => node.findAllByType('View').filter(view => view.props.style?.backgroundColor);
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
    clipboardText: '',
    clipboardReads: 0,
    closeCount: 0,
    storageWrites: 0,
    stored: null,
    writeError: null,
    writeGate: null,
    loadError: null,
    saveError: null,
    saveGate: null,
    invalidateError: null,
    alerts: [],
    writeSnapshots: [],
    events: [],
    successes: [],
    warnings: [],
  };
  const storage = {
    async getItem() {
      return state.stored;
    },
    async setItem(_key, value) {
      state.storageWrites += 1;
      state.writeSnapshots.push({ colorScheme: state.colorScheme, value });
      if (state.writeGate) await state.writeGate;
      if (state.writeError) throw state.writeError;
      state.stored = value;
    },
  };
  const constants = compile('lib/constants.ts', {});
  const registry =
    shared.registry ||
    compile(
      'lib/course-color-schemes.ts',
      { '@react-native-async-storage/async-storage': storage, '@/lib/constants': constants },
      (directory, recursive, filter) => {
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
      },
    );

  const focus = { focused: true, callback: null, cleanup: null };
  let operations = operationModules.get(registry);
  if (!operations) {
    operations = compile('lib/course-color-operations.ts', {});
    operationModules.set(registry, operations);
  }
  const expoRouter = {
    Stack: {
      Screen: ({ options }) => React.createElement('Screen', { options }, options.headerRight?.()),
    },
    router: { back: () => state.events.push(['back']), push: route => state.events.push(['push', route]) },
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
  };
  const dimensionListeners = new Set();
  let deferredAnimation;
  const resize = height => {
    state.windowHeight = height;
    dimensionListeners.forEach(listener => listener());
  };
  const native = {
    View: 'View',
    Modal: 'Modal',
    Keyboard: {
      dismiss: () => {
        state.events.push(['dismiss-keyboard']);
        if (state.keyboardDismissHeight) resize(state.keyboardDismissHeight);
      },
    },
    Platform: { OS: 'ios' },
    useWindowDimensions: () => ({
      width: 400,
      height: React.useSyncExternalStore(
        listener => {
          dimensionListeners.add(listener);
          return () => dimensionListeners.delete(listener);
        },
        () => state.windowHeight || 800,
      ),
    }),
    Pressable: 'Pressable',
    TextInput: 'TextInput',
    ActivityIndicator: 'ActivityIndicator',
    StyleSheet: { create: styles => styles },
    Alert: {
      alert(title, message, buttons) {
        state.alerts.push({ title, message, buttons });
      },
    },
  };
  const dependencies = {
    react: React,
    'react/jsx-runtime': require('react/jsx-runtime'),
    'react-native': native,
    'react-native-reanimated': {
      __esModule: true,
      default: { View: 'AnimatedView' },
      Easing: { quad: 'quad', inOut: value => value },
      useSharedValue: initial => React.useRef({ value: initial }).current,
      useAnimatedStyle: factory => factory(),
      withTiming(value, options, callback) {
        state.events.push(['animation', value, options.duration]);
        if (callback && state.deferAnimations) {
          deferredAnimation?.(false);
          deferredAnimation = callback;
        } else callback?.(true);
        return value;
      },
    },
    'react-native-worklets': { scheduleOnRN: callback => callback() },
    'react-native-gesture-handler': { ScrollView: 'ScrollView' },
    'react-native-keyboard-controller': {
      KeyboardAwareScrollView: 'KeyboardAwareScrollView',
      KeyboardAvoidingView: 'KeyboardAvoidingView',
    },
    'react-native-safe-area-context': { SafeAreaView: 'SafeAreaView' },
    '@react-native-clipboard/clipboard': {
      async getString() {
        state.clipboardReads++;
        return state.clipboardText;
      },
    },
    'expo-router': expoRouter,
    'sonner-native': {
      toast: {
        success: message => state.successes.push(message),
        warning: message => state.warnings.push(message),
      },
    },
    '@/components/page-container': 'PageContainer',
    '@/components/ui/button': { Button: 'Button' },
    '@/components/ui/input': { Input: 'Input' },
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
          state.events.push(['load']);
          if (state.loadError) throw state.loadError;
        },
        async applyColorScheme(id) {
          state.events.push(['apply-colors', id]);
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

  dependencies['@/components/course/course-color-editor-modal'] = compile(
    'components/course/course-color-editor-modal.tsx',
    dependencies,
  );

  let renderer;
  return {
    state,
    registry,
    operations,
    async mount(relativePath, t) {
      const Page = compile(relativePath, dependencies).default;
      const Host = () => {
        const [visible, setVisible] = React.useState(true);
        return visible
          ? React.createElement(Page, {
              id: shared.editorId,
              onClose: () => {
                state.closeCount++;
                setVisible(false);
              },
              onSaved: () => state.events.push(['editor-saved']),
            })
          : null;
      };
      await act(async () => {
        renderer = create(React.createElement(Host));
      });
      t.after(async () => {
        await act(async () => renderer.unmount());
      });
    },
    input: (label = '配色颜色') =>
      renderer.root.findAll(
        item => (item.type === 'Input' || item.type === 'TextInput') && item.props.accessibilityLabel === label,
      )[0],
    text: () => textOf(renderer.root),
    title: () => {
      const header = renderer.root.findAll(item => item.props.accessibilityRole === 'header')[0];
      return header ? textOf(header) : renderer.root.findByType('Screen').props.options.title;
    },
    modal: () => renderer.root.findAllByType('Modal')[0],
    nodes: type => renderer.root.findAllByType(type),
    async resize(height) {
      await act(async () => resize(height));
    },
    async finishAnimation() {
      await act(async () => {
        const animation = deferredAnimation;
        deferredAnimation = undefined;
        animation?.(true);
      });
    },
    async dispose() {
      await act(async () => renderer.update(null));
    },
    button: label => renderer.root.findAllByType('Button').find(button => textOf(button) === label),
    control: label =>
      renderer.root.findAll(
        item =>
          (item.type === 'Button' || item.type === 'Pressable') &&
          (item.props.accessibilityLabel === label || textOf(item) === label),
      )[0],
    pressable: label => renderer.root.findAllByType('Pressable').find(item => item.props.accessibilityLabel === label),
    radio: name =>
      renderer.root
        .findAllByType('Pressable')
        .find(item => item.props.accessibilityRole === 'radio' && item.props.accessibilityLabel === name),
    radios: () => renderer.root.findAllByType('Pressable').filter(item => item.props.accessibilityRole === 'radio'),
    cards: () =>
      renderer.root
        .findAllByType('Pressable')
        .filter(item => item.props.accessibilityRole === 'radio' || item.props.accessibilityLabel === '导入自定义配色'),
    async requestDelete() {
      const button = renderer.root.findAll(
        item => (item.type === 'Button' || item.type === 'Pressable') && item.props.accessibilityLabel === '删除配色',
      )[0];
      assert.ok(button, 'Missing header delete action');
      await act(async () => button.props.onPress());
    },
    async answerDelete(style) {
      const alert = state.alerts.at(-1);
      assert.ok(alert, 'Deletion must show a native confirmation');
      const action = alert.buttons.find(button => button.style === style);
      assert.ok(action, `Missing ${style} confirmation action`);
      await act(async () => action.onPress?.());
    },
    async blur() {
      await act(async () => {
        focus.focused = false;
        focus.cleanup?.();
        focus.cleanup = null;
      });
    },
    async refocus() {
      await act(async () => {
        focus.focused = true;
        focus.cleanup = focus.callback?.();
      });
    },
  };
}

const editorPath = 'components/course/course-color-editor-modal.tsx';
const listPath = 'app/settings/course-colors.tsx';
const customSchemes = page => page.registry.getCourseColorSchemes().filter(palette => palette.source === 'custom');
const enterEditor = async (page, name, colors = JSON.stringify(paletteColors)) => {
  await act(async () => {
    page.input('配色名称').props.onChangeText(name);
    page.input().props.onChangeText(colors);
  });
};
const seedSchemes = async (page, count) => {
  for (let index = 0; index < count; index++) {
    await page.registry.importCourseColorScheme(JSON.stringify(customPalette(`custom-${index}`, `配色 ${index}`)));
  }
};
const editorFor = (page, id) =>
  createHarness({
    state: page.state,
    registry: page.registry,
    editorId: id,
  });

test('new editor separates the name from supported colors forms and rejects malformed or wrong-length colors', async t => {
  const page = createHarness();
  await page.mount(editorPath, t);
  assert.equal(page.title(), '编辑课程配色');
  assert.equal(page.state.clipboardReads, 0, 'Opening the editor must not read the clipboard');
  assert.equal(page.control('保存配色').props.disabled, true);
  assert.doesNotMatch(page.text(), /JSON 格式说明|id：唯一标识/);
  await act(async () => page.button('填入示例').props.onPress());
  assert.equal(page.input('配色名称').props.value, '', 'The example must not overwrite the separate name');
  assert.match(page.text(), /未命名配色/);
  assert.equal(page.control('保存配色').props.disabled, true);

  for (const colors of [
    JSON.stringify(paletteColors),
    JSON.stringify({ colors: paletteColors }),
    `"colors": ${JSON.stringify(paletteColors)}`,
    JSON.stringify({ id: 'ignored-id', name: '忽略名称', colors: paletteColors }),
  ]) {
    await enterEditor(page, '独立名称', colors);
    assert.equal(page.control('保存配色').props.disabled, false);
    assert.match(page.text(), /独立名称/);
    assert.equal(page.input('配色名称').props.value, '独立名称');
  }
  for (const colors of [
    '{invalid json',
    JSON.stringify(paletteColors.slice(0, 24)),
    JSON.stringify([...paletteColors, '#ABCDEF']),
  ]) {
    await act(async () => page.input().props.onChangeText(colors));
    assert.equal(page.control('保存配色').props.disabled, true);
  }
  await act(async () =>
    page.input().props.onChangeText('x'.repeat(page.registry.MAX_COURSE_COLOR_SCHEME_JSON_LENGTH + 1)),
  );
  assert.match(page.text(), /32768/);
  assert.equal(page.control('保存配色').props.disabled, true);
  assert.equal(page.state.storageWrites, 0);
});

test('name validation counts ASCII as one and non-ASCII as two without silently truncating input', async t => {
  const page = createHarness();
  await page.mount(editorPath, t);
  for (const [name, valid] of [
    ['', false],
    ['abcdefghijklmnop', true],
    ['abcdefghijklmnopq', false],
    ['中文中文中文中文', true],
    ['中文中文中文中文文', false],
    ['课程abcdefghijkl', true],
    ['课程abcdefghijklm', false],
  ]) {
    await enterEditor(page, name);
    assert.equal(page.input('配色名称').props.value, name, 'Input must remain editable after an over-limit name');
    assert.equal(page.control('保存配色').props.disabled, !valid, name);
    if (name && !valid) assert.match(page.text(), /16/);
  }
});

test('clipboard access remains user initiated and pasted colors leave the entered name unchanged', async t => {
  const page = createHarness();
  await page.mount(editorPath, t);
  await act(async () => page.input('配色名称').props.onChangeText('保留名称'));
  assert.equal(page.state.clipboardReads, 0);
  await act(async () => page.button('从剪贴板粘贴').props.onPress());
  assert.match(page.text(), /剪贴板中没有文本/);
  page.state.clipboardText = `"colors": ${JSON.stringify(paletteColors)}`;
  await act(async () => page.button('从剪贴板粘贴').props.onPress());
  assert.equal(page.state.clipboardReads, 2);
  assert.equal(page.input('配色名称').props.value, '保留名称');
  assert.equal(page.input().props.value, page.state.clipboardText);
  assert.equal(page.control('保存配色').props.disabled, false);
});

test('new saves generate one custom identity, prevent duplicate submission, and return without applying it', async t => {
  const page = createHarness();
  await page.mount(editorPath, t);
  await enterEditor(page, '新建配色');
  const save = page.control('保存配色').props.onPress;
  await act(async () => {
    await Promise.all([save(), save()]);
  });
  assert.equal(page.state.storageWrites, 1);
  assert.equal(customSchemes(page).length, 1);
  assert.equal(customSchemes(page)[0].name, '新建配色');
  assert.ok(customSchemes(page)[0].id);
  assert.equal(page.state.colorScheme, 'old');
  assert.equal(
    page.state.events.some(event => event[0] === 'save'),
    false,
  );
  assert.equal(page.state.closeCount, 1);
});

test('save failures keep the editor and draft; retry succeeds without creating duplicate palettes', async t => {
  const page = createHarness();
  await page.mount(editorPath, t);
  await enterEditor(page, '失败后重试');
  page.state.writeError = new Error('模拟本地存储失败');
  await act(async () => page.control('保存配色').props.onPress());
  assert.match(page.text(), /失败/);
  assert.equal(page.state.closeCount, 0);
  assert.equal(customSchemes(page).length, 0);
  assert.equal(page.input('配色名称').props.value, '失败后重试');
  page.state.writeError = null;
  await act(async () => page.control('保存配色').props.onPress());
  assert.equal(customSchemes(page).length, 1);
  assert.equal(page.state.closeCount, 1);
});

test('editing an applied palette preserves its identity and invalidates the query without directly repainting cached courses', async t => {
  const parent = createHarness();
  await seedSchemes(parent, 1);
  parent.state.colorScheme = 'custom-0';
  const page = editorFor(parent, 'custom-0');
  await page.mount(editorPath, t);
  assert.equal(page.input('配色名称').props.value, '配色 0');
  assert.ok(page.input().props.value.includes(paletteColors[0]));
  const reversedColors = [...paletteColors].reverse();
  await enterEditor(page, '更新名称', JSON.stringify({ colors: reversedColors }));
  await act(async () => page.control('保存配色').props.onPress());
  assert.equal(customSchemes(page).length, 1);
  const updated = customSchemes(page)[0];
  assert.equal(updated.id, 'custom-0');
  assert.equal(updated.name, '更新名称');
  assert.equal(updated.colors[0], reversedColors[0]);
  assert.equal(page.state.colorScheme, 'custom-0');
  assert.equal(
    page.state.events.some(event => event[0] === 'apply-colors'),
    false,
    'Saving must retain the existing course cache and widget update timing',
  );
  assert.ok(page.state.events.some(event => event[0] === 'invalidate' && event[1] === 'course_page_all_data'));
  assert.equal(page.state.closeCount, 1);
});

test('full storage permits editing an existing palette but blocks creating a sixth one', async t => {
  const parent = createHarness();
  await seedSchemes(parent, 5);
  const editPage = editorFor(parent, 'custom-2');
  await editPage.mount(editorPath, t);
  await enterEditor(editPage, '满额可编辑');
  await act(async () => editPage.control('保存配色').props.onPress());
  assert.equal(customSchemes(parent).length, 5);
  assert.equal(parent.registry.getCourseColorScheme('custom-2').name, '满额可编辑');

  const createPage = createHarness({ state: parent.state, registry: parent.registry });
  await createPage.mount(editorPath, t);
  await enterEditor(createPage, '第六套');
  const writesBefore = parent.state.storageWrites;
  const backBefore = parent.state.closeCount;
  const saveButton = createPage.control('保存配色');
  if (!saveButton.props.disabled) await act(async () => saveButton.props.onPress());
  assert.match(createPage.text(), /5/);
  assert.equal(customSchemes(parent).length, 5);
  assert.equal(parent.state.storageWrites, writesBefore);
  assert.equal(parent.state.closeCount, backBefore);
});

test('missing or built-in edit identities show an error instead of becoming a new draft', async t => {
  for (const id of ['missing-custom', 'old']) {
    await t.test(id, async child => {
      const page = createHarness({ editorId: id });
      await page.mount(editorPath, child);
      assert.ok(!page.control('保存配色') || page.control('保存配色').props.disabled);
      assert.match(page.text(), /不存在|无法|内置|读取失败|找不到/);
      assert.equal(page.state.storageWrites, 0);
      assert.equal(page.state.closeCount, 0);
    });
  }
});

test('deleting an unsaved draft returns immediately without confirmation or storage mutation', async t => {
  const page = createHarness();
  await page.mount(editorPath, t);
  await enterEditor(page, 'abcdefghijklmnopq', '{invalid colors');
  assert.equal(page.control('保存配色').props.disabled, true);
  assert.equal(page.control('删除配色').props.disabled, false, 'Invalid draft data must not prevent leaving');
  await page.requestDelete();
  assert.equal(page.state.closeCount, 1);
  assert.equal(page.state.alerts.length, 0);
  assert.equal(page.state.storageWrites, 0);
  assert.equal(customSchemes(page).length, 0);
});

test('editing-page deletion confirms, cancellation preserves data, and deleting another palette keeps the active choice', async t => {
  const parent = createHarness();
  await seedSchemes(parent, 2);
  parent.state.colorScheme = 'custom-1';
  const page = editorFor(parent, 'custom-0');
  await page.mount(editorPath, t);
  const writesBefore = parent.state.storageWrites;
  await page.requestDelete();
  assert.equal(parent.state.storageWrites, writesBefore);
  await page.answerDelete('cancel');
  assert.ok(customSchemes(parent).some(palette => palette.id === 'custom-0'));
  assert.equal(parent.state.closeCount, 0);
  await page.requestDelete();
  await page.answerDelete('destructive');
  assert.equal(
    customSchemes(parent).some(palette => palette.id === 'custom-0'),
    false,
  );
  assert.equal(parent.state.colorScheme, 'custom-1');
  assert.equal(
    parent.state.events.some(event => event[0] === 'save'),
    false,
  );
  assert.equal(parent.state.closeCount, 1);
});

test('deleting the active edited palette saves the classic fallback before removing its stored colors', async t => {
  const parent = createHarness();
  await seedSchemes(parent, 1);
  parent.state.colorScheme = 'custom-0';
  const page = editorFor(parent, 'custom-0');
  await page.mount(editorPath, t);
  const writesBefore = parent.state.storageWrites;
  await page.requestDelete();
  await page.answerDelete('destructive');
  assert.equal(parent.state.colorScheme, 'old');
  assert.equal(customSchemes(parent).length, 0);
  assert.equal(parent.state.storageWrites, writesBefore + 1);
  assert.equal(parent.state.writeSnapshots.at(-1).colorScheme, 'old');
  assert.ok(parent.state.events.some(event => event[0] === 'invalidate'));
  assert.equal(parent.state.closeCount, 1);
});

test('delete failures preserve the stored palette and communicate a completed classic fallback', async t => {
  for (const active of [false, true]) {
    await t.test(active ? 'active palette' : 'another palette', async child => {
      const parent = createHarness();
      await seedSchemes(parent, 1);
      parent.state.colorScheme = active ? 'custom-0' : 'old';
      const page = editorFor(parent, 'custom-0');
      await page.mount(editorPath, child);
      parent.state.writeError = new Error('模拟删除失败');
      await page.requestDelete();
      await page.answerDelete('destructive');
      assert.equal(customSchemes(parent).length, 1);
      assert.equal(parent.state.colorScheme, 'old');
      assert.equal(parent.state.closeCount, 0);
      assert.match(page.text(), /删除.*失败/);
      if (active) assert.match(page.text(), /经典|回退/);
    });
  }
});

test('a failed classic fallback prevents deletion and keeps the applied custom palette', async t => {
  const parent = createHarness();
  await seedSchemes(parent, 1);
  parent.state.colorScheme = 'custom-0';
  const page = editorFor(parent, 'custom-0');
  await page.mount(editorPath, t);
  const writesBefore = parent.state.storageWrites;
  parent.state.saveError = new Error('模拟设置保存失败');
  await page.requestDelete();
  await page.answerDelete('destructive');
  assert.equal(parent.state.storageWrites, writesBefore);
  assert.equal(parent.state.colorScheme, 'custom-0');
  assert.equal(customSchemes(parent).length, 1);
  assert.equal(parent.state.closeCount, 0);
});

test('a list applies a custom palette on the first press and opens its editor on the second press', async t => {
  const page = createHarness();
  await seedSchemes(page, 1);
  await page.mount(listPath, t);
  assert.equal(page.radio('经典配色').props.accessibilityState.checked, true);
  assert.equal(page.pressable('删除「配色 0」'), undefined, 'Deletion belongs to the editing page');
  for (const radio of page.radios()) assert.equal(swatches(radio).length, 25);
  await act(async () => page.radio('配色 0').props.onPress());
  assert.equal(page.state.colorScheme, 'custom-0');
  assert.equal(page.radio('配色 0').props.accessibilityState.checked, true);
  assert.equal(
    page.state.events.some(event => event[0] === 'push'),
    false,
  );
  await act(async () => page.radio('配色 0').props.onPress());
  assert.ok(page.modal());
  assert.equal(page.input('配色名称').props.value, '配色 0');
  assert.equal(
    page.state.events.some(event => event[0] === 'push'),
    false,
  );
  await act(async () => page.modal().props.onRequestClose());
  assert.equal(page.modal(), undefined);

  await act(async () => page.radio('经典配色').props.onPress());
  const navigationCount = page.state.events.filter(event => event[0] === 'push').length;
  await act(async () => page.radio('经典配色').props.onPress());
  assert.equal(
    page.state.events.filter(event => event[0] === 'push').length,
    navigationCount,
    'Built-ins do not open an editor',
  );
});

test('the list add card follows all custom palettes at zero and four schemes and disappears at five', async t => {
  for (const count of [0, 4, 5]) {
    await t.test(`${count} saved custom palettes`, async child => {
      const page = createHarness();
      await seedSchemes(page, count);
      await page.mount(listPath, child);
      assert.doesNotMatch(page.text(), /选择一套配色应用到课程表|还没有自定义配色/);
      assert.equal(page.button('导入自定义配色'), undefined);
      const cards = page.cards();
      const addCard = page.pressable('导入自定义配色');
      if (count < 5) {
        assert.equal(cards.at(-1), addCard);
        assert.equal(textOf(addCard), '');
        await act(async () => page.radio('经典配色').props.onLayout({ nativeEvent: { layout: { height: 177 } } }));
        assert.equal(page.pressable('导入自定义配色').props.style.height, 177);
        await act(async () => addCard.props.onPress());
        assert.ok(page.modal());
        assert.equal(page.input('配色名称').props.value, '');
        assert.equal(
          page.state.events.some(event => event[0] === 'push'),
          false,
        );
      } else {
        assert.equal(addCard, undefined);
      }
    });
  }
});

test('deleting an edited palette restores the list add card and preserves another applied palette', async t => {
  const list = createHarness();
  await seedSchemes(list, 5);
  list.state.colorScheme = 'custom-1';
  await list.mount(listPath, t);
  assert.equal(list.pressable('导入自定义配色'), undefined);
  await list.blur();
  const editor = editorFor(list, 'custom-0');
  await editor.mount(editorPath, t);
  await editor.requestDelete();
  await editor.answerDelete('destructive');
  await list.refocus();
  assert.equal(list.radio('配色 0'), undefined);
  assert.equal(list.radio('配色 1').props.accessibilityState.checked, true);
  assert.equal(list.cards().at(-1), list.pressable('导入自定义配色'));
});

test('load failure can be retried and recovered storage warnings remain visible alongside valid palettes', async t => {
  const page = createHarness();
  page.state.loadError = new Error('模拟读取失败');
  page.state.stored = '{broken stored data';
  await page.mount(listPath, t);
  assert.match(page.text(), /读取课程配色失败/);
  assert.equal(page.pressable('导入自定义配色'), undefined);
  page.state.loadError = null;
  await act(async () => page.button('重试').props.onPress());
  assert.match(page.text(), /部分本机配色数据无法读取/);
  assert.equal(page.radios().length, page.registry.getCourseColorSchemes().length);
  assert.equal(page.state.storageWrites, 0);
});

test('a pending editor save becomes visible after returning to the list without another focus or automatic application', async t => {
  const editor = createHarness();
  editor.state.stored = '{broken stored data';
  await editor.mount(editorPath, t);
  await enterEditor(editor, '后台完成');
  let completeWrite;
  editor.state.writeGate = new Promise(resolve => {
    completeWrite = resolve;
  });
  let saving;
  await act(async () => {
    saving = editor.control('保存配色').props.onPress();
  });
  assert.equal(editor.operations.getCourseColorOperationPending(), true);
  await editor.dispose();
  const list = createHarness({ state: editor.state, registry: editor.registry });
  await list.mount(listPath, t);
  assert.equal(list.radio('后台完成'), undefined);
  assert.match(list.text(), /部分本机配色数据无法读取/);
  await act(async () => {
    completeWrite();
    await saving;
  });
  assert.ok(list.radio('后台完成'));
  assert.equal(list.radio('后台完成').props.accessibilityState.checked, false);
  assert.equal(list.radio('经典配色').props.accessibilityState.checked, true);
  assert.doesNotMatch(list.text(), /部分本机配色数据无法读取/);
  assert.equal(editor.state.closeCount, 0, 'An editor that lost focus must not navigate on completion');
});

test('a list cannot select a palette while another editor is deleting it across navigation', async t => {
  const parent = createHarness();
  await seedSchemes(parent, 1);
  const editor = editorFor(parent, 'custom-0');
  await editor.mount(editorPath, t);
  let completeWrite;
  parent.state.writeGate = new Promise(resolve => {
    completeWrite = resolve;
  });
  await editor.requestDelete();
  let deletion;
  await act(async () => {
    deletion = editor.state.alerts
      .at(-1)
      .buttons.find(button => button.style === 'destructive')
      .onPress();
  });
  assert.equal(editor.operations.getCourseColorOperationPending(), true);
  await editor.dispose();
  const list = createHarness({ state: editor.state, registry: editor.registry });
  await list.mount(listPath, t);
  assert.equal(list.radio('配色 0').props.disabled, true);
  await act(async () => list.radio('配色 0').props.onPress());
  assert.equal(
    parent.state.events.some(event => event[0] === 'save'),
    false,
  );
  await act(async () => {
    completeWrite();
    await deletion;
  });
  assert.equal(list.radio('配色 0'), undefined);
  assert.equal(list.radio('经典配色').props.accessibilityState.checked, true);
  assert.equal(list.operations.getCourseColorOperationPending(), false);
  assert.equal(parent.state.closeCount, 0);
});

test('a list showing an active palette synchronizes the classic fallback after a cross-page deletion finishes', async t => {
  const parent = createHarness();
  await seedSchemes(parent, 1);
  parent.state.colorScheme = 'custom-0';
  const editor = editorFor(parent, 'custom-0');
  await editor.mount(editorPath, t);
  let completeSave;
  let completeDelete;
  parent.state.saveGate = new Promise(resolve => {
    completeSave = resolve;
  });
  parent.state.writeGate = new Promise(resolve => {
    completeDelete = resolve;
  });
  await editor.requestDelete();
  let deletion;
  await act(async () => {
    deletion = editor.state.alerts
      .at(-1)
      .buttons.find(button => button.style === 'destructive')
      .onPress();
  });
  await editor.dispose();
  const list = createHarness({ state: editor.state, registry: editor.registry });
  await list.mount(listPath, t);
  assert.equal(list.radio('配色 0').props.accessibilityState.checked, true);
  await act(async () => completeSave());
  assert.equal(parent.state.colorScheme, 'old');
  assert.equal(list.operations.getCourseColorOperationPending(), true);
  await act(async () => {
    completeDelete();
    await deletion;
  });
  assert.equal(list.radio('配色 0'), undefined);
  assert.equal(list.radio('经典配色').props.accessibilityState.checked, true);
  assert.equal(list.radio('经典配色').props.disabled, false);
});

test('a persisted save with a failed refresh closes with a warning and reopens as one saved identity', async t => {
  const page = createHarness();
  await page.mount(editorPath, t);
  await enterEditor(page, '刷新重试');
  page.state.invalidateError = new Error('模拟刷新失败');
  await act(async () => page.control('保存配色').props.onPress());
  assert.equal(customSchemes(page).length, 1);
  const savedId = customSchemes(page)[0].id;
  assert.equal(page.state.closeCount, 1);
  assert.match(page.state.warnings.at(-1), /已保存.*刷新失败/);
  const reopened = editorFor(page, savedId);
  await reopened.mount(editorPath, t);
  page.state.invalidateError = null;
  await act(async () => reopened.control('保存配色').props.onPress());
  assert.equal(customSchemes(page).length, 1);
  assert.equal(customSchemes(page)[0].id, savedId);
  assert.equal(page.state.closeCount, 2);
});

test('the editor is a rounded three-quarter-screen native modal with fixed header actions and keyboard-aware content', async t => {
  const page = createHarness();
  await page.mount(editorPath, t);
  assert.equal(page.modal().props.visible, true);
  assert.equal(page.modal().props.transparent, true);
  assert.equal(page.nodes('Screen').length, 0, 'The editor must not create a separate route header');
  const sheet = page.nodes('AnimatedView').find(node => node.props.className.includes('rounded-t-3xl'));
  assert.ok(sheet);
  assert.equal(sheet.props.style[1].height, 800 * 0.75);
  assert.equal(page.nodes('KeyboardAvoidingView').length, 1);
  const scroll = page.nodes('KeyboardAwareScrollView')[0];
  assert.equal(scroll.props.keyboardShouldPersistTaps, 'handled');
  assert.equal(scroll.findAll(item => item.props.accessibilityLabel === '保存配色').length, 0);
  assert.equal(page.control('删除配色').parent, page.control('保存配色').parent);
  assert.equal(page.button('保存配色'), undefined, 'Saving belongs only to the header icon');
  assert.match(page.pressable('关闭配色编辑').props.className, /bg-\[#00000050\]/);
  assert.ok(page.state.events.some(event => event[0] === 'animation' && event[1] === 1 && event[2] === 250));
});

test('closing survives keyboard resize and rotation without restarting entry or allowing duplicate actions', async t => {
  const page = createHarness();
  await page.mount(editorPath, t);
  await enterEditor(page, '退出草稿');
  const save = page.control('保存配色').props.onPress;
  page.state.deferAnimations = true;
  page.state.keyboardDismissHeight = 900;
  const animationStart = page.state.events.length;
  await act(async () => page.pressable('关闭配色编辑').props.onPress());
  assert.ok(page.modal(), 'The modal remains mounted until exit animation finishes');
  assert.equal(page.state.closeCount, 0);
  await page.resize(600);
  await act(async () => {
    page.modal().props.onRequestClose();
    save();
  });
  assert.equal(page.state.storageWrites, 0);
  assert.deepEqual(
    page.state.events.slice(animationStart).filter(event => event[0] === 'animation'),
    [
      ['animation', 0, 250],
      ['animation', 800 * 0.75, 250],
    ],
  );
  await page.finishAnimation();
  assert.equal(page.modal(), undefined);
  assert.equal(page.state.closeCount, 1);
});

test('the list saves inside the modal, rejects close while writing, and refreshes the card without changing selection', async t => {
  const page = createHarness();
  await page.mount(listPath, t);
  await act(async () => page.pressable('导入自定义配色').props.onPress());
  await enterEditor(page, '弹层保存');
  let completeWrite;
  page.state.writeGate = new Promise(resolve => {
    completeWrite = resolve;
  });
  let saving;
  await act(async () => {
    saving = page.control('保存配色').props.onPress();
  });
  assert.equal(page.control('保存配色').props.disabled, true);
  assert.equal(page.pressable('关闭配色编辑').props.disabled, true);
  await act(async () => {
    page.modal().props.onRequestClose();
    page.pressable('关闭配色编辑').props.onPress();
  });
  assert.ok(page.modal());
  await act(async () => {
    completeWrite();
    await saving;
  });
  assert.equal(page.modal(), undefined);
  assert.ok(page.radio('弹层保存'));
  assert.equal(page.radio('经典配色').props.accessibilityState.checked, true);
  assert.equal(page.state.storageWrites, 1);
  assert.equal(
    page.state.events.some(event => event[0] === 'push' || event[0] === 'apply-colors'),
    false,
  );
  await act(async () => page.pressable('导入自定义配色').props.onPress());
  assert.equal(page.input('配色名称').props.value, '', 'Opening another draft must reset the closed form');
  await act(async () => page.modal().props.onRequestClose());
  assert.equal(page.modal(), undefined);
});

test('the list edits through accessibility and keeps active deletion open until fallback and storage complete', async t => {
  const page = createHarness();
  await seedSchemes(page, 1);
  page.state.colorScheme = 'custom-0';
  await page.mount(listPath, t);
  await act(async () => page.radio('配色 0').props.onAccessibilityAction({ nativeEvent: { actionName: 'edit' } }));
  assert.ok(page.modal());
  await page.requestDelete();
  await page.answerDelete('cancel');
  assert.equal(customSchemes(page).length, 1);
  assert.ok(page.modal());
  let completeWrite;
  page.state.writeGate = new Promise(resolve => {
    completeWrite = resolve;
  });
  await page.requestDelete();
  let deletion;
  await act(async () => {
    deletion = page.state.alerts
      .at(-1)
      .buttons.find(button => button.style === 'destructive')
      .onPress();
  });
  assert.equal(page.state.colorScheme, 'old');
  await act(async () => {
    page.modal().props.onRequestClose();
    page.pressable('关闭配色编辑').props.onPress();
  });
  assert.ok(page.modal());
  await act(async () => {
    completeWrite();
    await deletion;
  });
  assert.equal(page.modal(), undefined);
  assert.equal(page.radio('配色 0'), undefined);
  assert.equal(page.radio('经典配色').props.accessibilityState.checked, true);
});

test('an already mounted friend grid updates when its active palette is edited without changing its id or fetched courses', async t => {
  const page = createHarness();
  await seedSchemes(page, 2);
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
    '@/lib/course-color-schemes': page.registry,
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
      setting: { selectedSemester: '202601', colorScheme: 'custom-0' },
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
  assert.equal(renderedColor(), paletteColors[0]);
  assert.equal(processCount, 1);

  const editedColors = paletteColors.map((color, index) => (index === 0 ? '#ABCDEF' : color));
  await act(async () => {
    await page.registry.saveCourseColorScheme({ id: 'custom-0', name: '新配色', colors: editedColors });
  });
  assert.equal(renderedColor(), '#ABCDEF');
  assert.equal(processCount, 2, 'An edit with the same palette id must regenerate displayed friend colors');

  await act(async () => {
    await page.registry.saveCourseColorScheme({ id: 'custom-1', name: '其他配色', colors: editedColors });
  });
  assert.equal(processCount, 2, 'Editing an unrelated palette must preserve the current friend color allocation');
  assert.equal(renderedColor(), '#ABCDEF');
});
