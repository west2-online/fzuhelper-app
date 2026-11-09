export type CourseColorScheme = string;

export interface CourseColorPalette {
  readonly id: string;
  readonly name: string;
  readonly colors: readonly string[];
}

export const DEFAULT_COURSE_COLOR_SCHEME = 'old';
export const COURSE_COLOR_SCHEME_COLOR_COUNT = 25;

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

const validateCourseColorScheme = (value: unknown): CourseColorPalette => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('配色方案必须是包含 id、name 和 colors 的 JSON 对象。');
  }

  const { id, name, colors } = value as Record<string, unknown>;
  if (typeof id !== 'string' || !/^[a-z][a-z0-9-]{0,63}$/.test(id)) {
    throw new Error('id 必须是以小写字母开头的 1–64 位小写字母、数字、短横线组合。');
  }
  if (typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 40) {
    throw new Error('name 必须是 1–40 个字符的配色名称。');
  }
  return { id, name: name.trim(), colors: validateCourseColors(colors) };
};

// Metro 在构建时发现目录中的 JSON；增加内置方案只需增加文件，无需维护导入列表。
const builtinFiles = require.context('../assets/course-color-schemes', false, /\.json$/);
const builtinSchemes: readonly CourseColorPalette[] = Object.freeze(
  builtinFiles
    .keys()
    .sort()
    .map(filename => {
      try {
        const definition = validateCourseColorScheme(builtinFiles(filename));
        return Object.freeze({ ...definition, colors: Object.freeze(definition.colors) });
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

export const getCourseColorSchemes = (): readonly CourseColorPalette[] => builtinSchemes;

export const getCourseColorScheme = (id: CourseColorScheme): CourseColorPalette =>
  builtinSchemes.find(scheme => scheme.id === id) ??
  builtinSchemes.find(scheme => scheme.id === DEFAULT_COURSE_COLOR_SCHEME)!;

export const normalizeCourseColorScheme = (value: unknown): CourseColorScheme =>
  typeof value === 'string' && builtinSchemeIds.has(value) ? value : DEFAULT_COURSE_COLOR_SCHEME;

export const getCourseColors = (id: CourseColorScheme = DEFAULT_COURSE_COLOR_SCHEME): readonly string[] =>
  getCourseColorScheme(id).colors;
