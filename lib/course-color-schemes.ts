import AsyncStorage from '@react-native-async-storage/async-storage';

export type CourseColorScheme = string;

export interface CourseColorSchemeDefinition {
  id: string;
  name: string;
  colors: readonly string[];
}

export interface CourseColorPalette extends CourseColorSchemeDefinition {
  readonly id: string;
  readonly name: string;
  readonly colors: readonly string[];
  readonly source: 'builtin' | 'custom';
}

export const DEFAULT_COURSE_COLOR_SCHEME = 'old';
export const MAX_COURSE_COLOR_SCHEME_JSON_LENGTH = 32768;
export const COURSE_COLOR_SCHEME_COLOR_COUNT = 25;
export const MAX_CUSTOM_COURSE_COLOR_SCHEMES = 5;
export const MAX_COURSE_COLOR_SCHEME_NAME_LENGTH = 16;

const CUSTOM_COURSE_COLOR_SCHEMES_KEY = 'custom_course_color_schemes_v1';
const CUSTOM_COURSE_COLOR_SCHEMES_RECOVERY_KEY = 'custom_course_color_schemes_recovery_v1';

export const getCourseColorSchemeNameLength = (name: string): number =>
  Array.from(name).reduce((length, character) => length + (character.codePointAt(0)! <= 0x7f ? 1 : 2), 0);

export const validateCourseColorSchemeName = (name: string): string => {
  const normalized = name.trim();
  if (!normalized) throw new Error('请输入配色名称。');
  if (getCourseColorSchemeNameLength(normalized) > MAX_COURSE_COLOR_SCHEME_NAME_LENGTH) {
    throw new Error('配色名称过长，最多 16 个英文字符或 8 个汉字。');
  }
  return normalized;
};

const validateCourseColors = (colors: unknown): readonly string[] => {
  if (!Array.isArray(colors) || colors.length !== COURSE_COLOR_SCHEME_COLOR_COUNT) {
    throw new Error(`colors 必须是恰好包含 ${COURSE_COLOR_SCHEME_COLOR_COUNT} 个不重复颜色的数组。`);
  }

  const seenColors = new Set<string>();
  return colors.map((color: unknown, index: number) => {
    if (typeof color !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(color)) {
      throw new Error(`第 ${index + 1} 个颜色无效，请使用 #RRGGBB 格式，例如 #307D81。`);
    }
    const normalizedColor = color.toUpperCase();
    if (seenColors.has(normalizedColor)) {
      throw new Error(`第 ${index + 1} 个颜色 ${normalizedColor} 重复，请为每个颜色保留一个条目。`);
    }
    seenColors.add(normalizedColor);
    return normalizedColor;
  });
};

const validateCourseColorScheme = (value: unknown): CourseColorSchemeDefinition => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('配色方案必须是包含 id、name 和 colors 的 JSON 对象。');
  }

  const { id, name, colors } = value as Record<string, unknown>;
  if (typeof id !== 'string' || !/^(?:[a-z][a-z0-9-]{0,63}|[0-9a-f]{6})$/.test(id)) {
    throw new Error('id 必须是 6 位小写十六进制标识，或以小写字母开头的 1–64 位字母、数字、短横线组合。');
  }
  // 保留旧版名称和 id 的读取规则；新的 16 单位名称限制只用于编辑保存。
  if (typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 40) {
    throw new Error('name 必须是 1–40 个字符的配色名称。');
  }
  return { id, name: name.trim(), colors: validateCourseColors(colors) };
};

export const parseCourseColorsJson = (text: string): readonly string[] => {
  if (text.length > MAX_COURSE_COLOR_SCHEME_JSON_LENGTH) {
    throw new Error(`JSON 内容不能超过 ${MAX_COURSE_COLOR_SCHEME_JSON_LENGTH} 个字符。`);
  }
  const trimmed = text.trim();
  if (!trimmed) throw new Error('请先粘贴配色颜色 JSON。');

  let value: unknown;
  try {
    value = JSON.parse(/^"colors"\s*:/.test(trimmed) ? `{${trimmed}}` : trimmed);
  } catch {
    throw new Error('JSON 格式有误，请检查双引号、逗号和括号。');
  }
  if (Array.isArray(value)) return validateCourseColors(value);
  if (typeof value === 'object' && value !== null) {
    return validateCourseColors((value as Record<string, unknown>).colors);
  }
  throw new Error('请输入颜色数组、包含 colors 的 JSON 对象或 "colors": [...] 字段片段。');
};

export const parseCourseColorSchemeJson = (text: string): CourseColorSchemeDefinition => {
  if (text.length > MAX_COURSE_COLOR_SCHEME_JSON_LENGTH) {
    throw new Error(`JSON 内容不能超过 ${MAX_COURSE_COLOR_SCHEME_JSON_LENGTH} 个字符。`);
  }
  if (!text.trim()) {
    throw new Error('请先粘贴配色方案 JSON。');
  }

  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error('JSON 格式有误，请检查双引号、逗号和括号。');
  }
  return validateCourseColorScheme(value);
};

const createPalette = (
  definition: CourseColorSchemeDefinition,
  source: CourseColorPalette['source'],
): CourseColorPalette => Object.freeze({ ...definition, colors: Object.freeze([...definition.colors]), source });

// Metro 在构建时发现目录中的 JSON；增加内置方案只需增加文件，无需维护导入列表。
const builtinFiles = require.context('../assets/course-color-schemes', false, /\.json$/);
const builtinSchemes: readonly CourseColorPalette[] = Object.freeze(
  builtinFiles
    .keys()
    .sort()
    .map(filename => {
      try {
        return createPalette(validateCourseColorScheme(builtinFiles(filename)), 'builtin');
      } catch (error) {
        throw new Error(`内置配色文件 ${filename} 无效：${error instanceof Error ? error.message : '格式错误'}`);
      }
    })
    .sort((left, right) => {
      if (left.id === DEFAULT_COURSE_COLOR_SCHEME) return -1;
      if (right.id === DEFAULT_COURSE_COLOR_SCHEME) return 1;
      return 0;
    }),
);

const builtinSchemeIds = new Set<string>();
for (const scheme of builtinSchemes) {
  if (builtinSchemeIds.has(scheme.id)) {
    throw new Error(`内置配色 id「${scheme.id}」重复，请为每个方案使用独立的 id。`);
  }
  builtinSchemeIds.add(scheme.id);
}
if (!builtinSchemeIds.has(DEFAULT_COURSE_COLOR_SCHEME)) {
  throw new Error('缺少默认配色方案 old，请保留 assets/course-color-schemes 中的经典配色。');
}

let customSchemes: readonly CourseColorPalette[] = Object.freeze([]);
let registeredSchemes: readonly CourseColorPalette[] = builtinSchemes;
let loaded = false;
let loadPromise: Promise<void> | undefined;
let mutationQueue: Promise<void> = Promise.resolve();
let loadWarning = '';
let recoveryRaw: string | null = null;
let recoveryBackupSaved = false;
let generatedIdCounter = 0;
const courseColorSchemeListeners = new Set<() => void>();

export const subscribeCourseColorSchemes = (listener: () => void): (() => void) => {
  courseColorSchemeListeners.add(listener);
  return () => {
    courseColorSchemeListeners.delete(listener);
  };
};

const notifyCourseColorSchemes = (): void => {
  for (const listener of [...courseColorSchemeListeners]) {
    try {
      listener();
    } catch (error) {
      // 订阅者错误不应把已成功持久化的操作误报为失败。
      console.error('更新课程配色列表失败:', error);
    }
  }
};

// 快照只在成功加载或持久化变更后更新，便于页面可靠地比较和刷新列表。
export const getCourseColorSchemes = (): readonly CourseColorPalette[] => registeredSchemes;

export const getCourseColorSchemeLoadWarning = (): string => loadWarning;

export const getCourseColorScheme = (id: CourseColorScheme): CourseColorPalette =>
  registeredSchemes.find(scheme => scheme.id === id) ??
  builtinSchemes.find(scheme => scheme.id === DEFAULT_COURSE_COLOR_SCHEME)!;

export const normalizeCourseColorScheme = (value: unknown): CourseColorScheme =>
  typeof value === 'string' && registeredSchemes.some(scheme => scheme.id === value)
    ? value
    : DEFAULT_COURSE_COLOR_SCHEME;

export const getCourseColors = (id: CourseColorScheme = DEFAULT_COURSE_COLOR_SCHEME): readonly string[] =>
  getCourseColorScheme(id).colors;

export const loadCourseColorSchemes = (): Promise<void> => {
  if (loaded) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const stored = await AsyncStorage.getItem(CUSTOM_COURSE_COLOR_SCHEMES_KEY);
    if (stored !== null) {
      let values: unknown;
      let skipped = false;
      try {
        values = JSON.parse(stored);
      } catch {
        skipped = true;
      }
      const ids = new Set(builtinSchemeIds);
      const palettes: CourseColorPalette[] = [];
      if (Array.isArray(values)) {
        for (const value of values) {
          try {
            const definition = validateCourseColorScheme(value);
            if (ids.has(definition.id) || palettes.length >= MAX_CUSTOM_COURSE_COLOR_SCHEMES) {
              skipped = true;
              continue;
            }
            ids.add(definition.id);
            palettes.push(createPalette(definition, 'custom'));
          } catch {
            skipped = true;
          }
        }
      } else {
        skipped = true;
      }

      // 单条损坏、旧自定义 id 与新增内置 id 冲突，都不应阻塞整张课表。
      // 读取时保留原始存储，之后修改前先备份，避免有效条目写回时丢失原文。
      if (skipped) {
        recoveryRaw = stored;
        loadWarning = '部分本机配色数据无法读取，暂时显示可用方案。';
      }
      customSchemes = Object.freeze(palettes);
      registeredSchemes = Object.freeze([...builtinSchemes, ...customSchemes]);
    }
    loaded = true;
    notifyCourseColorSchemes();
  })().finally(() => {
    // 失败后允许下一次读取重试，不缓存失败状态。
    loadPromise = undefined;
  });

  return loadPromise;
};

const enqueueCourseColorSchemeMutation = <T>(mutate: () => Promise<T>): Promise<T> => {
  const operation = mutationQueue.then(mutate);
  // 新建、编辑和删除共用队列，单次失败不会阻止之后的操作。
  mutationQueue = operation.then(
    () => undefined,
    () => undefined,
  );
  return operation;
};

const persistCustomCourseColorSchemes = async (schemes: readonly CourseColorPalette[]): Promise<void> => {
  const nextCustomSchemes = Object.freeze([...schemes]);
  const definitions = nextCustomSchemes.map(({ id, name, colors }) => ({ id, name, colors }));
  if (recoveryRaw !== null && !recoveryBackupSaved) {
    await AsyncStorage.setItem(CUSTOM_COURSE_COLOR_SCHEMES_RECOVERY_KEY, recoveryRaw);
    recoveryBackupSaved = true;
  }
  await AsyncStorage.setItem(CUSTOM_COURSE_COLOR_SCHEMES_KEY, JSON.stringify(definitions));
  customSchemes = nextCustomSchemes;
  registeredSchemes = Object.freeze([...builtinSchemes, ...customSchemes]);
  recoveryRaw = null;
  loadWarning = '';
  notifyCourseColorSchemes();
};

const generateCourseColorSchemeId = (): string => {
  let id: string;
  do {
    // FNV-1a 短哈希只用于本机标识；时间、随机数和递增序号共同提供种子。
    const seed = `${Date.now()}-${Math.random()}-${generatedIdCounter++}`;
    let hash = 0x811c9dc5;
    // eslint-disable-next-line no-bitwise -- FNV-1a 使用异或混合字符。
    for (const character of seed) hash = Math.imul(hash ^ character.charCodeAt(0), 0x01000193);
    // eslint-disable-next-line no-bitwise -- 转为无符号 32 位值，再取 6 位十六进制字符。
    id = (hash >>> 0).toString(16).padStart(8, '0').slice(-6);
  } while (registeredSchemes.some(scheme => scheme.id === id));
  return id;
};

export const saveCourseColorScheme = (input: {
  id?: CourseColorScheme;
  name: string;
  colors: readonly string[];
}): Promise<CourseColorPalette> =>
  enqueueCourseColorSchemeMutation(async () => {
    await loadCourseColorSchemes();
    const name = validateCourseColorSchemeName(input.name);
    const colors = validateCourseColors(input.colors);
    if (input.id !== undefined) {
      if (builtinSchemeIds.has(input.id)) throw new Error('内置配色方案不能修改。');
      const index = customSchemes.findIndex(scheme => scheme.id === input.id);
      if (index === -1) throw new Error(`自定义配色「${input.id}」不存在，可能已被删除。`);
      const palette = createPalette({ id: input.id, name, colors }, 'custom');
      const nextSchemes = [...customSchemes];
      nextSchemes[index] = palette;
      await persistCustomCourseColorSchemes(nextSchemes);
      return palette;
    }
    if (customSchemes.length >= MAX_CUSTOM_COURSE_COLOR_SCHEMES) {
      throw new Error(`最多可保存 ${MAX_CUSTOM_COURSE_COLOR_SCHEMES} 个自定义配色方案。`);
    }
    const palette = createPalette({ id: generateCourseColorSchemeId(), name, colors }, 'custom');
    await persistCustomCourseColorSchemes([...customSchemes, palette]);
    return palette;
  });

export const importCourseColorScheme = (text: string): Promise<CourseColorPalette> =>
  enqueueCourseColorSchemeMutation(async () => {
    await loadCourseColorSchemes();
    const definition = parseCourseColorSchemeJson(text);
    if (registeredSchemes.some(scheme => scheme.id === definition.id)) {
      throw new Error(`配色 id「${definition.id}」已存在，请修改 id 后再导入。`);
    }
    if (customSchemes.length >= MAX_CUSTOM_COURSE_COLOR_SCHEMES) {
      throw new Error(`最多可保存 ${MAX_CUSTOM_COURSE_COLOR_SCHEMES} 个自定义配色方案。`);
    }

    const palette = createPalette(definition, 'custom');
    await persistCustomCourseColorSchemes([...customSchemes, palette]);
    return palette;
  });

export const deleteCourseColorScheme = (id: CourseColorScheme): Promise<void> =>
  enqueueCourseColorSchemeMutation(async () => {
    await loadCourseColorSchemes();
    if (builtinSchemeIds.has(id)) {
      throw new Error('内置配色方案不能删除。');
    }
    if (!customSchemes.some(scheme => scheme.id === id)) {
      throw new Error(`自定义配色「${id}」不存在，可能已被删除。`);
    }
    await persistCustomCourseColorSchemes(customSchemes.filter(scheme => scheme.id !== id));
  });
