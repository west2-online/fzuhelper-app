import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider as ReactNavigationThemeProvider } from '@react-navigation/native';
import { colorScheme } from 'nativewind';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { type ColorSchemeName, ImageSourcePropType, useColorScheme as useSystemColorScheme } from 'react-native';

import { DARKEN_BACKGROUND_KEY } from '@/lib/constants';
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
  const [hasCustomBackground, setHasCustomBackground] = useState(false);
  const [darkenBackground, setDarkenBackgroundState] = useState(false);

  const resolvedTheme = useMemo(() => resolveTheme(themeSetting, systemTheme), [themeSetting, systemTheme]);

  // 主题设置
  const setThemeSetting = useCallback(async (nextTheme: ThemeSetting) => {
    setThemeSettingState(nextTheme);
    await setThemePreference(nextTheme);
    colorScheme.set(nextTheme);
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

  const contextValue = useMemo<ThemeContextValue>(
    () => ({
      themeSetting,
      currentTheme: resolvedTheme,
      isDarkTheme: resolvedTheme === 'dark',
      setThemeSetting,
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
