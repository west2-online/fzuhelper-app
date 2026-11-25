import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider as ReactNavigationThemeProvider } from '@react-navigation/native';
import { colorScheme } from 'nativewind';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  DeviceEventEmitter,
  ImageSourcePropType,
  useColorScheme as useSystemColorScheme,
  type ColorSchemeName,
} from 'react-native';

import { COURSE_SETTINGS_KEY, DARKEN_BACKGROUND_KEY } from '@/lib/constants';
import { getCourseSetting } from '@/lib/course';
import { DEFAULT_COURSE_COLOR_SCHEME, type CourseColorScheme } from '@/lib/palettes';
import { USER_LOGOUT_EVENT } from '@/lib/user';
import {
  checkCustomBackground,
  getBackgroundImagePath,
  getDarkenBackground,
  getThemePreference,
  removeBackgroundImageFile,
  setThemePreference,
  ThemeSetting,
  writeBackgroundImageFromPath,
} from '@/utils/theme';

type ResolvedTheme = 'light' | 'dark';

type Props = {
  children: React.ReactNode;
};

type ThemeContextValue = {
  /**
   * 主题模式设置，'light' | 'dark' | 'system'
   */
  themeSetting: ThemeSetting;
  /**
   * 当前实际使用的主题，'light' | 'dark'
   */
  currentTheme: ResolvedTheme;
  isDarkTheme: boolean;
  setThemeSetting: (theme: ThemeSetting) => Promise<void>;
  courseColorScheme: CourseColorScheme | null | undefined;
  loadCourseColorScheme: () => Promise<void>;
  setCourseColorScheme: (scheme: CourseColorScheme) => Promise<void>;
  // 背景配置相关
  hasCustomBackground: boolean;
  darkenBackground: boolean;
  setBackgroundImage: (imagePath: string) => Promise<void>;
  deleteBackgroundImage: () => Promise<void>;
  setDarkenBackground: (value: boolean) => Promise<void>;
  getBackgroundImage: (refresh: boolean) => ImageSourcePropType;
  getBackgroundImagePath: () => string;
  refreshBackgroundState: () => Promise<void>;
};

const AppThemeContext = createContext<ThemeContextValue | null>(null);

const resolveTheme = (setting: ThemeSetting, systemTheme: ColorSchemeName): ResolvedTheme => {
  if (setting === 'system') {
    return systemTheme === 'dark' ? 'dark' : 'light';
  }
  return setting;
};

// Read/write helpers moved to utils/theme.ts

export const AppThemeProvider = ({ children }: Props) => {
  const systemTheme = useSystemColorScheme();
  const [themeSetting, setThemeSettingState] = useState<ThemeSetting>('system');
  const [courseColorScheme, setCourseColorSchemeState] = useState<CourseColorScheme | null>();
  const [hasCustomBackground, setHasCustomBackground] = useState(false);
  const [darkenBackground, setDarkenBackgroundState] = useState(false);

  const resolvedTheme = useMemo(() => resolveTheme(themeSetting, systemTheme), [themeSetting, systemTheme]);

  // 主题设置
  const setThemeSetting = useCallback(async (nextTheme: ThemeSetting) => {
    setThemeSettingState(nextTheme);
    await setThemePreference(nextTheme);
    colorScheme.set(nextTheme);
  }, []);

  const loadCourseColorScheme = useCallback(async () => {
    setCourseColorSchemeState(current => current ?? undefined);
    try {
      const { colorScheme: storedScheme } = await getCourseSetting();
      setCourseColorSchemeState(current => current ?? storedScheme);
    } catch (error) {
      console.error('读取课程配色失败:', error);
      setCourseColorSchemeState(current => current ?? null);
    }
  }, []);

  const setCourseColorScheme = useCallback(async (scheme: CourseColorScheme) => {
    await AsyncStorage.mergeItem(COURSE_SETTINGS_KEY, JSON.stringify({ colorScheme: scheme }));
    setCourseColorSchemeState(scheme);
  }, []);

  // 背景相关方法
  const setBackgroundImage = useCallback(async (imagePath: string) => {
    await writeBackgroundImageFromPath(imagePath);
    setHasCustomBackground(true);
  }, []);

  const deleteBackgroundImage = useCallback(async () => {
    await removeBackgroundImageFile();
    setHasCustomBackground(false);
  }, []);

  const setDarkenBackground = useCallback(async (value: boolean) => {
    await AsyncStorage.setItem(DARKEN_BACKGROUND_KEY, value ? 'true' : 'false');
    setDarkenBackgroundState(value);
  }, []);

  const getBackgroundImage = useCallback((refresh: boolean): ImageSourcePropType => {
    if (refresh) {
      return { uri: getBackgroundImagePath(), cache: 'reload' };
    }
    return { uri: getBackgroundImagePath(), cache: 'default' };
  }, []);

  const refreshBackgroundState = useCallback(async () => {
    const hasBackground = await checkCustomBackground();
    setHasCustomBackground(hasBackground);
    const darken = await getDarkenBackground();
    setDarkenBackgroundState(darken);
  }, []);

  // 初始化主题和背景配置
  const initializeSettings = useCallback(async () => {
    const storedTheme = await getThemePreference();
    setThemeSettingState(storedTheme);
    colorScheme.set(storedTheme);

    const hasBackground = await checkCustomBackground();
    setHasCustomBackground(hasBackground);

    const darken = await getDarkenBackground();
    setDarkenBackgroundState(darken);
  }, []);

  useEffect(() => {
    initializeSettings().catch(() => undefined);
  }, [initializeSettings]);

  useEffect(() => {
    const logoutSubscription = DeviceEventEmitter.addListener(USER_LOGOUT_EVENT, () => {
      setCourseColorSchemeState(DEFAULT_COURSE_COLOR_SCHEME);
    });
    loadCourseColorScheme();
    return () => logoutSubscription.remove();
  }, [loadCourseColorScheme]);

  const contextValue = useMemo<ThemeContextValue>(
    () => ({
      themeSetting,
      currentTheme: resolvedTheme,
      isDarkTheme: resolvedTheme === 'dark',
      setThemeSetting,
      courseColorScheme,
      loadCourseColorScheme,
      setCourseColorScheme,
      hasCustomBackground,
      darkenBackground,
      setBackgroundImage,
      deleteBackgroundImage,
      setDarkenBackground,
      getBackgroundImage,
      getBackgroundImagePath,
      refreshBackgroundState,
    }),
    [
      themeSetting,
      resolvedTheme,
      hasCustomBackground,
      darkenBackground,
      setThemeSetting,
      courseColorScheme,
      loadCourseColorScheme,
      setCourseColorScheme,
      setBackgroundImage,
      deleteBackgroundImage,
      setDarkenBackground,
      getBackgroundImage,
      refreshBackgroundState,
    ],
  );

  return (
    <AppThemeContext.Provider value={contextValue}>
      <ReactNavigationThemeProvider value={resolvedTheme === 'dark' ? DarkTheme : DefaultTheme}>
        {children}
      </ReactNavigationThemeProvider>
    </AppThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(AppThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within AppThemeProvider');
  }
  return context;
};
