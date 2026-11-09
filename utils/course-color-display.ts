export interface CourseColorDisplayOptions {
  hasCustomBackground?: boolean;
  darkenBackground?: boolean;
  compensate?: boolean;
}

type Triple = readonly [number, number, number];

const ALPHA = 0.75;
const MAX_LIGHTNESS_SHIFT = 0.12;
const MAX_CHROMA_SHIFT = 0.04;
const MAX_CHROMA_RATIO = 0.35;
const WALLPAPER_STRENGTH = 0.25;
const CACHE_LIMIT = 512;
const displayColorCache = new Map<string, string>();

const clamp = (value: number, min = 0, max = 1): number => Math.min(max, Math.max(min, value));

// W3C CSS Color 4: sRGB transfer functions and D65 OKLab matrices.
// XYZ matrices are multiplied together here to avoid an intermediate XYZ allocation.
// https://www.w3.org/TR/css-color-4/#color-conversion-code
const decodeSrgb = (value: number): number =>
  Math.abs(value) <= 0.04045 ? value / 12.92 : Math.sign(value) * ((Math.abs(value) + 0.055) / 1.055) ** 2.4;

const encodeSrgb = (value: number): number =>
  Math.abs(value) <= 0.0031308 ? value * 12.92 : Math.sign(value) * (1.055 * Math.abs(value) ** (1 / 2.4) - 0.055);

const srgbToOklab = ([red, green, blue]: Triple): Triple => {
  const r = decodeSrgb(red);
  const g = decodeSrgb(green);
  const b = decodeSrgb(blue);
  const l = Math.cbrt(0.41222146947076305 * r + 0.5363325372617348 * g + 0.05144599326750221 * b);
  const m = Math.cbrt(0.21190349581782522 * r + 0.6806995506452344 * g + 0.10739695353694056 * b);
  const s = Math.cbrt(0.08830245919005643 * r + 0.2817188391361215 * g + 0.6299787016738222 * b);
  return [
    0.210454268309314 * l + 0.7936177747023054 * m - 0.0040720430116193 * s,
    1.9779985324311684 * l - 2.42859224204858 * m + 0.450593709617411 * s,
    0.0259040424655478 * l + 0.7827717124575296 * m - 0.8086757549230774 * s,
  ];
};

const oklchToLinearSrgb = (lightness: number, chroma: number, hue: number): Triple => {
  const a = chroma * Math.cos(hue);
  const b = chroma * Math.sin(hue);
  const l = (lightness + 0.3963377773761749 * a + 0.2158037573099136 * b) ** 3;
  const m = (lightness - 0.1055613458156586 * a - 0.0638541728258133 * b) ** 3;
  const s = (lightness - 0.0894841775298119 * a - 1.2914855480194092 * b) ** 3;
  return [
    4.076741636075958 * l - 3.3077115392580616 * m + 0.2309699031821043 * s,
    -1.2684379732850317 * l + 2.6097573492876887 * m - 0.34131937600265727 * s,
    -0.004196076138675564 * l - 0.7034186179359363 * m + 1.7076146940746117 * s,
  ];
};

const isInGamut = (rgb: Triple): boolean => rgb.every(channel => channel >= -1e-9 && channel <= 1 + 1e-9);

const gamutMap = (lightness: number, chroma: number, hue: number): { rgb: Triple; chroma: number } => {
  let rgb = oklchToLinearSrgb(lightness, chroma, hue);
  if (isInGamut(rgb)) return { rgb, chroma };

  // Preserve L/h and reduce C to the sRGB boundary, rather than clipping RGB channels.
  let lower = 0;
  let upper = chroma;
  rgb = oklchToLinearSrgb(lightness, 0, hue);
  for (let iteration = 0; iteration < 12; iteration++) {
    const middle = (lower + upper) / 2;
    const candidate = oklchToLinearSrgb(lightness, middle, hue);
    if (isInGamut(candidate)) {
      lower = middle;
      rgb = candidate;
    } else {
      upper = middle;
    }
  }
  return { rgb, chroma: lower };
};

const quantize = (linearRgb: Triple): Triple => [
  Math.round(clamp(encodeSrgb(linearRgb[0])) * 255),
  Math.round(clamp(encodeSrgb(linearRgb[1])) * 255),
  Math.round(clamp(encodeSrgb(linearRgb[2])) * 255),
];

const compositeError = (source: Triple, background: number, target: Triple): number => {
  // Ordinary SDR surfaces blend encoded sRGB; decode the result only when measuring OKLab error.
  // https://skia.org/docs/dev/design/raster_tragedy/#the-gamma-hack
  // https://www.w3.org/TR/compositing-1/#simplealphacompositing
  const backdrop = (1 - ALPHA) * background;
  const composite = srgbToOklab([
    (ALPHA * source[0] + backdrop) / 255,
    (ALPHA * source[1] + backdrop) / 255,
    (ALPHA * source[2] + backdrop) / 255,
  ]);
  return (composite[0] - target[0]) ** 2 + (composite[1] - target[1]) ** 2 + (composite[2] - target[2]) ** 2;
};

const compensateColor = (original: Triple, background: number, strength: number): Triple => {
  const target = srgbToOklab([original[0] / 255, original[1] / 255, original[2] / 255]);
  const targetChroma = Math.hypot(target[1], target[2]);
  const chroma = targetChroma <= 0.000004 ? 0 : targetChroma;
  const hue = chroma === 0 ? 0 : Math.atan2(target[2], target[1]);
  const lightnessShift = MAX_LIGHTNESS_SHIFT * strength;
  const chromaShift = Math.min(MAX_CHROMA_SHIFT, chroma * MAX_CHROMA_RATIO) * strength;
  const minLightness = clamp(target[0] - lightnessShift);
  const maxLightness = clamp(target[0] + lightnessShift);
  const minChroma = Math.max(0, chroma - chromaShift);
  const maxChroma = chroma + chromaShift;

  // The unchanged 8-bit source is always eligible: compensation cannot worsen reference error.
  let bestRgb = original;
  let bestLightness = target[0];
  let bestChroma = chroma;
  let bestError = compositeError(original, background, target);

  const consider = (lightness: number, candidateChroma: number): void => {
    const l = clamp(lightness, minLightness, maxLightness);
    const c = clamp(candidateChroma, minChroma, maxChroma);
    const mapped = gamutMap(l, c, hue);
    // Gamut mapping must not evade the chroma-change limit by desaturating excessively.
    if (mapped.chroma < minChroma - 1e-9) return;
    const candidate = quantize(mapped.rgb);
    const error = compositeError(candidate, background, target);
    if (error < bestError - 1e-14) {
      bestError = error;
      bestRgb = candidate;
      bestLightness = l;
      bestChroma = mapped.chroma;
    }
  };

  // Fixed budget: 35 coarse candidates plus two 9-candidate refinements per uncached color.
  let lightnessStep = (maxLightness - minLightness) / 6;
  let chromaStep = (maxChroma - minChroma) / 4;
  for (let lightnessIndex = 0; lightnessIndex <= 6; lightnessIndex++) {
    for (let chromaIndex = 0; chromaIndex <= 4; chromaIndex++) {
      consider(minLightness + lightnessStep * lightnessIndex, minChroma + chromaStep * chromaIndex);
    }
  }
  for (let iteration = 0; iteration < 2; iteration++) {
    lightnessStep /= 2;
    chromaStep /= 2;
    const centerLightness = bestLightness;
    const centerChroma = bestChroma;
    for (let lightnessOffset = -1; lightnessOffset <= 1; lightnessOffset++) {
      for (let chromaOffset = -1; chromaOffset <= 1; chromaOffset++) {
        consider(centerLightness + lightnessOffset * lightnessStep, centerChroma + chromaOffset * chromaStep);
      }
    }
  }
  return bestRgb;
};

const rgba = (rgb: Triple): string => `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${ALPHA})`;

/** Produces display-only color; callers must retain the original scheme and cached course colors. */
export const getCourseDisplayColor = (
  color: string,
  darkMode: boolean,
  options: CourseColorDisplayOptions = {},
): string => {
  // Leave alpha-bearing and other formats intact so repeated rendering never stacks alpha.
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) return color;
  const rgb: Triple = [
    parseInt(color.slice(1, 3), 16),
    parseInt(color.slice(3, 5), 16),
    parseInt(color.slice(5, 7), 16),
  ];
  if (options.compensate === false) return rgba(rgb);

  const hasWallpaper = options.hasCustomBackground === true;
  // Wallpaper pixels are unknown: use independent middle gray, with only 25% compensation.
  // The optional black overlay matches PageContainer's #00000050, independent of the theme.
  const background = hasWallpaper ? 128 * (options.darkenBackground ? 1 - 80 / 255 : 1) : darkMode ? 18 : 247;
  const strength = hasWallpaper ? WALLPAPER_STRENGTH : 1;
  const key = `${color.toUpperCase()}:${background}:${strength}`;
  const cached = displayColorCache.get(key);
  if (cached !== undefined) {
    displayColorCache.delete(key);
    displayColorCache.set(key, cached);
    return cached;
  }

  const result = rgba(compensateColor(rgb, background, strength));
  displayColorCache.set(key, result);
  if (displayColorCache.size > CACHE_LIMIT) {
    const oldest = displayColorCache.keys().next().value;
    if (oldest !== undefined) displayColorCache.delete(oldest);
  }
  return result;
};
