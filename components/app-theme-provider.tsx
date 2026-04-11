import { DarkTheme, DefaultTheme, ThemeProvider as ReactNavigationThemeProvider } from '@react-navigation/native';
import { colorScheme } from 'nativewind';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, type ColorSchemeName, useColorScheme as useSystemColorScheme } from 'react-native';

import { getThemePreference, setThemePreference } from '@/lib/appearance';

// RN 0.83 changed undefined/null to 'unspecified'.
// Nativewind v4 hasn't adapted to it, so patch for old behavior
const _getColorScheme = Appearance.getColorScheme.bind(Appearance);

Appearance.getColorScheme = () => {
  const scheme = _getColorScheme();
  if (scheme === 'unspecified') return undefined;
  return scheme;
};

type ThemeSetting = 'light' | 'dark' | 'system';
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
};

const AppThemeContext = createContext<ThemeContextValue | null>(null);

const resolveTheme = (setting: ThemeSetting, systemTheme: ColorSchemeName): ResolvedTheme => {
  if (setting === 'system') {
    return systemTheme === 'dark' ? 'dark' : 'light';
  }
  return setting;
};

export const AppThemeProvider = ({ children }: Props) => {
  const systemTheme = useSystemColorScheme();
  const [themeSetting, setThemeSettingState] = useState<ThemeSetting>('system');

  const resolvedTheme = useMemo(() => resolveTheme(themeSetting, systemTheme), [themeSetting, systemTheme]);

  const setThemeSetting = useCallback(
    async (nextTheme: ThemeSetting) => {
      setThemeSettingState(nextTheme);
      await setThemePreference(nextTheme);
      colorScheme.set(nextTheme);
    },
    [setThemeSettingState],
  );

  const syncThemeFromStorage = useCallback(async () => {
    const storedTheme = await getThemePreference();
    setThemeSettingState(storedTheme);
    colorScheme.set(storedTheme);
  }, []);

  useEffect(() => {
    syncThemeFromStorage().catch(() => undefined);
  }, [syncThemeFromStorage]);

  const contextValue = useMemo<ThemeContextValue>(
    () => ({
      themeSetting,
      currentTheme: resolvedTheme,
      isDarkTheme: resolvedTheme === 'dark',
      setThemeSetting,
    }),
    [themeSetting, resolvedTheme, setThemeSetting],
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
