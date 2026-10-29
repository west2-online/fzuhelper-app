import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ActivityIndicator, Pressable, View, type LayoutChangeEvent } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import AddPaletteIcon from '@/assets/images/course/add-palette.svg';
import ColorPalettePreview from '@/components/course/color-palette-preview';
import CourseColorEditorModal from '@/components/course/course-color-editor-modal';
import PageContainer from '@/components/page-container';
import { queryClient } from '@/components/query-provider';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { COURSE_PAGE_ALL_DATA_KEY } from '@/lib/constants';
import { CourseCache, getCourseSetting, updateCourseSetting } from '@/lib/course';
import {
  beginCourseColorOperation,
  getCourseColorOperationPending,
  subscribeCourseColorOperations,
} from '@/lib/course-color-operations';
import {
  DEFAULT_COURSE_COLOR_SCHEME,
  getCourseColorScheme,
  getCourseColorSchemeLoadWarning,
  getCourseColorSchemes,
  loadCourseColorSchemes,
  MAX_CUSTOM_COURSE_COLOR_SCHEMES,
  subscribeCourseColorSchemes,
  type CourseColorPalette,
} from '@/lib/course-color-schemes';
import { cn } from '@/lib/utils';

export default function CourseColorsPage() {
  const palettes = useSyncExternalStore(subscribeCourseColorSchemes, getCourseColorSchemes, getCourseColorSchemes);
  const [selectedId, setSelectedId] = useState<string>(DEFAULT_COURSE_COLOR_SCHEME);
  const [isLoading, setLoading] = useState(true);
  const isSaving = useSyncExternalStore(
    subscribeCourseColorOperations,
    getCourseColorOperationPending,
    getCourseColorOperationPending,
  );
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [paletteCardHeight, setPaletteCardHeight] = useState(144);
  const [editor, setEditor] = useState<{ id?: string } | null>(null);
  const mountedRef = useRef(true);
  const focusVersionRef = useRef(0);
  const loadWarning = getCourseColorSchemeLoadWarning();
  const measurePaletteCard = useCallback((event: LayoutChangeEvent) => {
    setPaletteCardHeight(event.nativeEvent.layout.height);
  }, []);
  const closeEditor = useCallback(() => setEditor(null), []);
  const refreshAfterEdit = useCallback(() => setRetryCount(count => count + 1), []);
  const openEditor = useCallback((id?: string) => {
    if (getCourseColorOperationPending()) return;
    setEditor(current => current ?? { id });
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      focusVersionRef.current += 1;
      setLoading(true);
      setLoadError('');
      setSaveError('');
      setSuccessMessage('');

      const load = async () => {
        try {
          await CourseCache.load();
          await loadCourseColorSchemes();
          const settings = await getCourseSetting();
          if (!active) return;
          setSelectedId(getCourseColorScheme(settings.colorScheme).id);
        } catch {
          if (active) setLoadError('读取课程配色失败，请重试。');
        } finally {
          if (active) setLoading(false);
        }
      };

      load();
      return () => {
        active = false;
        focusVersionRef.current += 1;
      };
      // 重试时重新执行当前聚焦页面的完整读取流程。
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [retryCount]),
  );

  useEffect(() => {
    if (isLoading || isSaving || loadError) return;
    let active = true;
    // 另一页面实例完成删除/回退后，也同步当前页面的选中项。
    getCourseSetting()
      .then(settings => {
        if (active && !getCourseColorOperationPending()) setSelectedId(getCourseColorScheme(settings.colorScheme).id);
      })
      .catch(() => {
        if (active) setLoadError('读取课程配色失败，请重试。');
      });
    return () => {
      active = false;
    };
  }, [isLoading, isSaving, loadError, palettes]);

  const handleSelect = useCallback(
    async (palette: CourseColorPalette) => {
      if (editor || isLoading || loadError || getCourseColorOperationPending()) return;
      if (palette.id === selectedId) {
        if (palette.source === 'custom') {
          openEditor(palette.id);
        }
        return;
      }
      const finish = beginCourseColorOperation();
      if (!finish) return;
      const focusVersion = focusVersionRef.current;
      const isActive = () => focusVersionRef.current === focusVersion;
      setSaveError('');
      setSuccessMessage('');
      let saved = false;

      try {
        await updateCourseSetting({ colorScheme: palette.id });
        saved = true;
        if (isActive()) setSelectedId(palette.id);
        await queryClient.invalidateQueries({ queryKey: [COURSE_PAGE_ALL_DATA_KEY] });
        if (isActive()) {
          setSuccessMessage(`已应用「${palette.name}」`);
          toast.success('课程配色已更新');
        }
      } catch {
        if (isActive())
          setSaveError(saved ? '配色已保存，课表刷新失败，请返回课表下拉刷新。' : '切换配色失败，请重试。');
      } finally {
        finish();
        if (mountedRef.current) {
          if (!isActive()) setRetryCount(count => count + 1);
        }
      }
    },
    [editor, isLoading, loadError, openEditor, selectedId],
  );

  const renderPalette = (palette: CourseColorPalette) => {
    const selected = palette.id === selectedId;
    return (
      <Pressable
        key={palette.id}
        accessibilityRole="radio"
        accessibilityLabel={palette.name}
        accessibilityState={{ checked: selected, selected, disabled: isSaving }}
        accessibilityActions={
          palette.source === 'custom'
            ? [
                { name: 'activate', label: selected ? '编辑配色' : '应用配色' },
                { name: 'edit', label: '编辑配色' },
              ]
            : undefined
        }
        onAccessibilityAction={
          palette.source === 'custom'
            ? event => {
                if (event.nativeEvent.actionName === 'edit' && !getCourseColorOperationPending()) {
                  openEditor(palette.id);
                }
                if (event.nativeEvent.actionName === 'activate') handleSelect(palette);
              }
            : undefined
        }
        disabled={isSaving}
        accessibilityHint={palette.source === 'custom' ? '点按应用，选中后再次点按编辑' : undefined}
        onLayout={palette.id === DEFAULT_COURSE_COLOR_SCHEME ? measurePaletteCard : undefined}
        className={cn(
          'mb-3 rounded-xl border border-border bg-card p-4 active:opacity-80',
          selected && 'border-primary',
          isSaving && 'opacity-60',
        )}
        onPress={() => handleSelect(palette)}
      >
        <ColorPalettePreview name={palette.name} colors={palette.colors} />
      </Pressable>
    );
  };

  const builtInPalettes = palettes.filter(palette => palette.source === 'builtin');
  const customPalettes = palettes.filter(palette => palette.source === 'custom');
  const customLimitReached = customPalettes.length >= MAX_CUSTOM_COURSE_COLOR_SCHEMES;

  return (
    <>
      <Stack.Screen options={{ title: '课程配色' }} />
      <PageContainer>
        <ScrollView className="flex-1 px-6" contentContainerClassName="py-6">
          <SafeAreaView edges={['bottom']}>
            {isLoading ? (
              <View className="items-center gap-3 py-8" accessibilityLiveRegion="polite">
                <ActivityIndicator />
                <Text className="text-text-secondary">正在读取配色…</Text>
              </View>
            ) : loadError ? (
              <View className="gap-3 py-4">
                <Text className="text-destructive" accessibilityRole="alert">
                  {loadError}
                </Text>
                <Button variant="outline" onPress={() => setRetryCount(count => count + 1)}>
                  <Text>重试</Text>
                </Button>
              </View>
            ) : (
              <>
                {!!loadWarning && (
                  <Text className="mb-4 text-sm leading-6 text-text-secondary" accessibilityLiveRegion="polite">
                    {loadWarning}
                  </Text>
                )}
                <Text className="mb-3 text-sm text-text-secondary">内置配色</Text>
                {builtInPalettes.map(renderPalette)}

                <Text className="mb-3 mt-4 text-sm text-text-secondary">我的配色</Text>
                {customPalettes.map(renderPalette)}
                {!customLimitReached && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="导入自定义配色"
                    accessibilityState={{ disabled: isSaving }}
                    disabled={isSaving}
                    className="mb-3 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-card active:opacity-60"
                    style={{ height: paletteCardHeight }}
                    onPress={() => openEditor()}
                  >
                    <AddPaletteIcon width={36} height={36} color="#9CA3AF" />
                  </Pressable>
                )}

                {isSaving && (
                  <Text className="mb-3 text-sm text-text-secondary" accessibilityLiveRegion="polite">
                    正在保存配色…
                  </Text>
                )}
                {!!saveError && (
                  <Text className="mb-3 text-sm text-destructive" accessibilityRole="alert">
                    {saveError}
                  </Text>
                )}
                {!!successMessage && (
                  <Text className="mb-3 text-sm text-primary" accessibilityLiveRegion="polite">
                    {successMessage}
                  </Text>
                )}
              </>
            )}
          </SafeAreaView>
        </ScrollView>
      </PageContainer>
      {editor && <CourseColorEditorModal id={editor.id} onClose={closeEditor} onSaved={refreshAfterEdit} />}
    </>
  );
}
