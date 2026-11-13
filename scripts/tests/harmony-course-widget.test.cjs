const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');

const root = path.resolve(__dirname, '../..');
const library = path.join(root, 'modules/native-widget/harmony/library/src/main/ets');
function loadEts(file, imports = {}) {
  const source = fs.readFileSync(path.join(library, file), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const module = { exports: {} };
  vm.runInNewContext(outputText, {
    exports: module.exports,
    require: name => {
      assert.ok(name in imports, `Unexpected native dependency: ${name}`);
      return imports[name];
    },
    console,
    Date,
  });
  return module.exports;
}
const data = loadEts('widget/WidgetData.ets');
const config = loadEts('widget/WidgetConfig.ets');
const at = time => Date.parse(`2026-10-21T${time}+08:00`);
const event = (extra = {}) => ({
  date: '2026-10-21',
  name: '操作系统',
  location: '东3-301',
  remark: '带实验报告',
  startMinute: 500,
  endMinute: 600,
  ...extra,
});
const snapshot = (events = [], extra = {}) => ({
  version: 2,
  timeZone: 'Asia/Shanghai',
  startDate: '2026-09-01',
  endDate: '2027-01-15',
  events,
  ...extra,
});
const cache = (events = [], extra = {}) => JSON.stringify({ widgetSnapshot: snapshot(events, extra) });
const view = (json, time = '09:30:00', preview = false) =>
  data.buildWidgetBindingData(json, true, preview, 0, at(time));

test('ongoing courses remain until their actual end, including exams beyond 21:35', () => {
  const json = cache([event(), event({ name: '期中考试', startMinute: 1200, endMinute: 1350 })]);
  assert.equal(view(json).today.events[0].name, '操作系统');
  assert.equal(view(json, '10:00:00').today.events[0].name, '期中考试');
  const late = view(json, '21:40:00', true);
  assert.equal(late.smallDay.isTomorrow, false);
  assert.equal(late.courseTime, '20:00-22:30');
});

test('tomorrow switch matches PR #509 at the exact cutoff and on opt-in', () => {
  const json = cache([event(), event({ date: '2026-10-22', name: '计算机图形学' })]);
  assert.equal(view(json, '10:00:00').smallDay.emptyText, '今日课程已结束');
  assert.equal(view(json, '10:00:00', true).smallDay.isTomorrow, true);
  assert.equal(view(json, '21:34:59').smallDay.isTomorrow, false);
  assert.equal(view(json, '21:35:00').courseName, '计算机图形学');
  assert.equal(view(json, '21:35:00').courseTime, '明日 08:20-10:00');
  assert.equal(view(json, '21:35:00').today.emptyText, '今日课程已结束');
});

test('no course, before term and after term retain distinct states', () => {
  assert.equal(view(cache()).smallDay.emptyText, '今日没有课程');
  assert.equal(view(cache(), '09:30:00', true).smallDay.emptyText, '明日没有课程');
  assert.equal(view(cache([], { startDate: '2026-11-01' })).today.emptyText, '尚未开学');
  assert.equal(view(cache([], { endDate: '2026-10-20' })).today.emptyText, '本学期已结束');
});

test('date rollover uses Shanghai even with a different process timezone', () => {
  const now = Date.parse('2026-10-21T16:00:00Z');
  const result = data.buildWidgetBindingData(cache([event({ date: '2026-10-22' })]), false, false, 3, now);
  assert.equal(result.today.title, '10月22日');
  assert.equal(result.today.weekday, '周四');
  assert.equal(result.today.events.length, 1);
  assert.equal(result.showRemarks, false);
  assert.equal(result.verticalInset, 3);
  assert.equal(result.smallDay.isTomorrow, false);
});

test('missing, legacy and unsupported snapshots prompt sync; corrupt v2 reports an error', () => {
  for (const json of ['', '{}', 'null', '{"courseData":{}}', cache([], { version: 3 })]) {
    const result = view(json);
    assert.equal(result.hasSnapshot, false);
    assert.equal(result.message, '请打开福uu同步课表');
  }
  for (const json of [
    '{',
    cache([], { timeZone: 'UTC' }),
    cache([], { events: null }),
    cache([event({ endMinute: 499 })]),
    cache([event({ date: '2026-02-30' })]),
  ]) {
    const result = view(json);
    assert.equal(result.hasSnapshot, false);
    assert.equal(result.message, '课表数据异常，请重新同步');
  }
});

test('refresh schedules course ends, 21:35 and midnight with FormKit minimum delay', () => {
  const json = cache([event()]);
  assert.equal(data.nextWidgetRefreshMinutes(json, at('09:30:00')), 30);
  assert.equal(data.nextWidgetRefreshMinutes(json, at('09:59:00')), 5);
  assert.equal(data.nextWidgetRefreshMinutes(json, at('10:00:00')), 695);
  assert.equal(data.nextWidgetRefreshMinutes(json, at('21:30:00')), 5);
  assert.equal(data.nextWidgetRefreshMinutes(json, at('21:35:00')), 145);
  assert.equal(data.nextWidgetRefreshMinutes(json, at('23:59:59')), 5);
});

function store() {
  const values = new Map();
  return {
    getSync: (key, fallback) => (values.has(key) ? values.get(key) : fallback),
    putSync: (key, value) => values.set(key, value),
    deleteSync: key => values.delete(key),
    get: async (key, fallback) => (values.has(key) ? values.get(key) : fallback),
    put: async (key, value) => values.set(key, value),
    flush: async () => {},
  };
}

test('settings are per form and removing one form preserves the others', () => {
  const prefs = store();
  assert.equal(config.readWidgetConfig(prefs, 'small').showRemarks, true);
  assert.equal(config.readWidgetConfig(prefs, 'small').previewTomorrow, false);
  config.putShowRemarks(prefs, 'small', false);
  config.putPreviewTomorrow(prefs, 'small', true);
  config.putShowAsSquare(prefs, 'small', true);
  config.putFormMetrics(prefs, 'small', 160, 200);
  assert.equal(config.readWidgetConfig(prefs, 'small').verticalInset, 20);
  assert.equal(config.readWidgetConfig(prefs, 'medium').showRemarks, true);
  config.putPreviewTomorrow(prefs, 'medium', true);
  config.deleteWidgetConfig(prefs, 'small');
  assert.equal(config.readWidgetConfig(prefs, 'small').showRemarks, true);
  assert.equal(config.readWidgetConfig(prefs, 'medium').previewTomorrow, true);
});

test('native publisher prunes only confirmed removed forms and continues after update errors', async () => {
  const prefs = store();
  prefs.putSync(data.WIDGET_FORM_IDS_KEY, ['gone', 'offline', 'valid']);
  const updated = [];
  const scheduling = [];
  const wants = [];
  class ExpoModule {
    context = {
      uiAbilityContext: { abilityInfo: { bundleName: 'test.fzuhelper.debug' } },
    };
  }
  const { NativeWidgetModule } = loadEts('NativeWidgetModule.ets', {
    '@expo-harmony/expo-modules-core': { ExpoModule },
    '@kit.ArkData': { preferences: { getPreferences: async () => prefs } },
    '@kit.FormKit': {
      formBindingData: { createFormBindingData: value => value },
      formProvider: {
        openFormManager: want => wants.push(want),
        updateForm: async (id, value) => {
          updated.push([id, value]);
          if (id === 'gone') throw { code: 16501001 };
          if (id === 'offline') throw { code: 16500050 };
        },
        setFormNextRefreshTime: async (id, minutes) => scheduling.push([id, minutes]),
      },
    },
    './widget/WidgetData': data,
    './widget/WidgetConfig': config,
  });
  const module = new NativeWidgetModule();
  await assert.rejects(module.setWidgetData(cache(), ''), /Failed to update HarmonyOS widgets/);
  assert.equal(updated.length, 3);
  assert.equal(Array.from(prefs.getSync(data.WIDGET_FORM_IDS_KEY)).join(','), 'offline,valid');
  assert.equal(scheduling[0][0], 'valid');
  assert.equal(prefs.getSync(data.WIDGET_DATA_KEY), cache());
  assert.equal(await module.requestPinAppWidget(72201), 4);
  assert.equal(await module.requestPinAppWidget(72204), 4);
  assert.equal(await module.requestPinAppWidget(72203), 2);
  assert.equal(await module.requestPinAppWidget(72202), 0);
  assert.equal(wants[0].bundleName, 'test.fzuhelper.debug');
  assert.equal(wants[0].abilityName, 'NextClassFormAbility');
  assert.equal(wants[1].parameters['ohos.extra.param.key.form_name'], 'CourseOverviewCard');
  assert.equal(wants[1].parameters['ohos.extra.param.key.form_dimension'], 3);
});
