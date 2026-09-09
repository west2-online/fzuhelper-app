import CustomBackgroundImage from '@/assets/images/banner/default_banner1.webp';
import { useTheme } from '@/components/app-theme-provider';
import MultiStateView, { STATE } from '@/components/multistateview/multi-state-view';
import PageContainer from '@/components/page-container';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import type { ThemeSetting } from '@/utils/theme';
import { Stack } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { ImageBackground, Keyboard, TextInput as NativeTextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { toast } from 'sonner-native';

export type ComponentTestContentMode = 'normal' | 'longZh' | 'longEn' | 'empty' | 'error' | 'loading';

type BackgroundMode = 'normal' | 'custom' | 'dark';
type KeyboardMode = 'off' | 'on';

type Option<T extends string> = {
  label: string;
  value: T;
};

type ComponentTestFrameworkProps = {
  renderTarget: (contentMode: ComponentTestContentMode) => ReactElement;
};

const THEME_OPTIONS: Option<ThemeSetting>[] = [
  { label: 'light', value: 'light' },
  { label: 'dark', value: 'dark' },
  { label: 'system', value: 'system' },
];

const BACKGROUND_OPTIONS: Option<BackgroundMode>[] = [
  { label: 'normal', value: 'normal' },
  { label: 'custom background', value: 'custom' },
  { label: 'dark background', value: 'dark' },
];

const CONTENT_OPTIONS: Option<ComponentTestContentMode>[] = [
  { label: 'normal', value: 'normal' },
  { label: 'long zh', value: 'longZh' },
  { label: 'long en', value: 'longEn' },
  { label: 'empty', value: 'empty' },
  { label: 'error', value: 'error' },
  { label: 'loading', value: 'loading' },
];

const KEYBOARD_OPTIONS: Option<KeyboardMode>[] = [
  { label: 'off', value: 'off' },
  { label: 'on', value: 'on' },
];

export default function ComponentTestFramework({ renderTarget }: ComponentTestFrameworkProps) {
  const { themeSetting, currentTheme, setThemeSetting } = useTheme();
  const initialThemeRef = useRef<ThemeSetting>(themeSetting);
  const keyboardInputRef = useRef<NativeTextInput>(null);
  const [backgroundMode, setBackgroundMode] = useState<BackgroundMode>('normal');
  const [contentMode, setContentMode] = useState<ComponentTestContentMode>('normal');
  const [keyboardMode, setKeyboardMode] = useState<KeyboardMode>('off');

  const keyboardEnabled = keyboardMode === 'on';
  const multiState = useMemo(() => {
    switch (contentMode) {
      case 'empty':
        return STATE.EMPTY;
      case 'error':
        return STATE.ERROR;
      case 'loading':
        return STATE.LOADING;
      default:
        return STATE.CONTENT;
    }
  }, [contentMode]);

  const handleThemeChange = useCallback(
    (nextTheme: ThemeSetting) => {
      setThemeSetting(nextTheme).catch(error => {
        toast.error(`切换主题失败：${error}`);
      });
    },
    [setThemeSetting],
  );

  useEffect(() => {
    if (!keyboardEnabled) {
      keyboardInputRef.current?.blur();
      Keyboard.dismiss();
      return;
    }

    const timer = setTimeout(() => {
      keyboardInputRef.current?.focus();
    }, 150);

    return () => clearTimeout(timer);
  }, [keyboardEnabled]);

  useEffect(() => {
    const initialTheme = initialThemeRef.current;
    return () => {
      setThemeSetting(initialTheme).catch(() => undefined);
    };
  }, [setThemeSetting]);

  return (
    <>
      <Stack.Screen options={{ title: 'Component Test' }} />
      <PageContainer>
        <KeyboardAwareScrollView className="flex-1" keyboardShouldPersistTaps="handled">
          <View className="gap-4 px-3 pb-8">
            <NativeTextInput ref={keyboardInputRef} className="absolute left-0 top-0 h-px w-px opacity-0" caretHidden />
            <ControlPanel
              backgroundMode={backgroundMode}
              contentMode={contentMode}
              currentTheme={currentTheme}
              keyboardMode={keyboardMode}
              themeSetting={themeSetting}
              onBackgroundChange={setBackgroundMode}
              onContentChange={setContentMode}
              onKeyboardChange={setKeyboardMode}
              onThemeChange={handleThemeChange}
            />

            <PreviewFrame
              backgroundMode={backgroundMode}
              currentTheme={currentTheme}
              multiState={multiState}
              renderTarget={renderTarget}
              textMode={contentMode}
            />
          </View>
        </KeyboardAwareScrollView>
      </PageContainer>
    </>
  );
}

function ControlPanel({
  backgroundMode,
  contentMode,
  currentTheme,
  keyboardMode,
  themeSetting,
  onBackgroundChange,
  onContentChange,
  onKeyboardChange,
  onThemeChange,
}: {
  backgroundMode: BackgroundMode;
  contentMode: ComponentTestContentMode;
  currentTheme: 'light' | 'dark';
  keyboardMode: KeyboardMode;
  themeSetting: ThemeSetting;
  onBackgroundChange: (value: BackgroundMode) => void;
  onContentChange: (value: ComponentTestContentMode) => void;
  onKeyboardChange: (value: KeyboardMode) => void;
  onThemeChange: (value: ThemeSetting) => void;
}) {
  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between px-1">
        <Text className="text-lg font-bold">Component Test</Text>
        <Text className="text-sm text-text-secondary">{currentTheme}</Text>
      </View>
      <SegmentedControl label="theme" options={THEME_OPTIONS} value={themeSetting} onChange={onThemeChange} />
      <SegmentedControl
        label="background"
        options={BACKGROUND_OPTIONS}
        value={backgroundMode}
        onChange={onBackgroundChange}
      />
      <SegmentedControl label="content" options={CONTENT_OPTIONS} value={contentMode} onChange={onContentChange} />
      <SegmentedControl label="keyboard" options={KEYBOARD_OPTIONS} value={keyboardMode} onChange={onKeyboardChange} />
    </View>
  );
}

function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View>
      <Text className="mb-1 px-1 text-sm font-semibold text-text-secondary">{label}</Text>
      <View className="flex-row flex-wrap">
        {options.map(option => {
          const selected = option.value === value;
          return (
            <Button
              key={option.value}
              className="min-w-24 px-3"
              size="sm"
              variant={selected ? 'default' : 'outline'}
              onPress={() => onChange(option.value)}
            >
              <Text>{option.label}</Text>
            </Button>
          );
        })}
      </View>
    </View>
  );
}

function PreviewFrame({
  backgroundMode,
  currentTheme,
  multiState,
  renderTarget,
  textMode,
}: {
  backgroundMode: BackgroundMode;
  currentTheme: 'light' | 'dark';
  multiState: STATE;
  renderTarget: (contentMode: ComponentTestContentMode) => ReactElement;
  textMode: ComponentTestContentMode;
}) {
  const content = (
    <View className="flex-1">
      <View className="flex-1">
        <MultiStateView
          className="min-h-full"
          content={renderTarget(textMode)}
          refresh={() => toast.info('refresh')}
          state={multiState}
        />
      </View>
    </View>
  );

  return (
    <View>
      <View className="mb-2 flex-row items-center justify-between px-1">
        <Text className="text-sm font-semibold text-text-secondary">preview</Text>
        <Text className="text-sm text-text-secondary">{currentTheme}</Text>
      </View>
      <View className="h-[620px] overflow-hidden rounded-lg border border-border bg-background">
        {backgroundMode === 'normal' ? (
          content
        ) : (
          <ImageBackground className="flex-1" resizeMode="cover" source={CustomBackgroundImage}>
            {backgroundMode === 'dark' && <View className="absolute h-full w-full bg-black/70" />}
            <View className={cn('flex-1', backgroundMode === 'custom' && 'bg-background/60')}>{content}</View>
          </ImageBackground>
        )}
      </View>
    </View>
  );
}
