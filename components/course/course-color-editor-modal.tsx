import Clipboard from '@react-native-clipboard/clipboard';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { KeyboardAvoidingView, KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import { toast } from 'sonner-native';

import DeletePaletteIcon from '@/assets/images/course/delete-palette.svg';
import SavePaletteIcon from '@/assets/images/course/save-palette.svg';
import ColorPalettePreview from '@/components/course/color-palette-preview';
import { queryClient } from '@/components/query-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  deleteCourseColorScheme,
  getCourseColorSchemeNameLength,
  getCourseColorSchemes,
  loadCourseColorSchemes,
  MAX_COURSE_COLOR_SCHEME_JSON_LENGTH,
  MAX_COURSE_COLOR_SCHEME_NAME_LENGTH,
  parseCourseColorsJson,
  saveCourseColorScheme,
  validateCourseColorSchemeName,
} from '@/lib/course-color-schemes';

const EXAMPLE_JSON = JSON.stringify(
  [
    '#81B8D8',
    '#8FC8BC',
    '#A8B7D8',
    '#E3C49C',
    '#D6AAB8',
    '#629DBD',
    '#72B3A6',
    '#8B9FC7',
    '#D5AE81',
    '#C58FA2',
    '#477F9F',
    '#559A8D',
    '#7187AF',
    '#BD9468',
    '#AD748B',
    '#306681',
    '#3D8074',
    '#576D94',
    '#A37A50',
    '#935D73',
    '#244E65',
    '#2E655B',
    '#425478',
    '#83623F',
    '#76495C',
  ],
  null,
  2,
);

const styles = StyleSheet.create({
  sheet: { maxHeight: '100%' },
  content: { paddingTop: 8, paddingBottom: 24 },
  input: { height: 240, textAlignVertical: 'top' },
});

interface CourseColorEditorModalProps {
  id?: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function CourseColorEditorModal({ id, onClose, onSaved }: CourseColorEditorModalProps) {
  const { height } = useWindowDimensions();
  const sheetHeight = height * 0.75;
  const slideAnim = useSharedValue(sheetHeight);
  const fadeAnim = useSharedValue(0);
  const [isClosing, setClosing] = useState(false);
  const closingRef = useRef(false);
  const [name, setName] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [operation, setOperation] = useState<'paste' | 'save' | 'delete' | null>(null);
  const [operationError, setOperationError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [isLoading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const isMutating = useSyncExternalStore(
    subscribeCourseColorOperations,
    getCourseColorOperationPending,
    getCourseColorOperationPending,
  );
  const busyRef = useRef(false);
  const mountedRef = useRef(true);
  const lifecycleVersionRef = useRef(0);
  const initializedIdRef = useRef<string | null>(null);
  const savedIdRef = useRef(id);
  const deletedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    lifecycleVersionRef.current += 1;
    setLoading(true);
    setLoadError('');
    const editorKey = id ?? '';
    const initialize = initializedIdRef.current !== editorKey;
    if (initialize) {
      savedIdRef.current = id;
      deletedRef.current = false;
    }
    const load = async () => {
      try {
        await CourseCache.load();
        await loadCourseColorSchemes();
        if (!active) return;
        if (deletedRef.current) throw new Error('配色已删除，请返回列表。');
        const palette = savedIdRef.current
          ? getCourseColorSchemes().find(item => item.id === savedIdRef.current && item.source === 'custom')
          : undefined;
        if (savedIdRef.current && !palette) throw new Error('找不到这套自定义配色，请返回列表。');
        if (initialize) {
          setName(palette?.name ?? '');
          setJsonText(palette ? JSON.stringify(palette.colors, null, 2) : '');
          initializedIdRef.current = editorKey;
        }
      } catch (error) {
        if (active) setLoadError(error instanceof Error ? error.message : '读取配色失败，请重试。');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
      lifecycleVersionRef.current += 1;
    };
    // 重试只重新读取存储，不覆盖已经输入的草稿。
  }, [id, retryCount]);

  const animate = useCallback(
    (enter: boolean, callback?: () => void) => {
      fadeAnim.value = withTiming(enter ? 1 : 0, { duration: 250 });
      slideAnim.value = withTiming(
        enter ? 0 : sheetHeight,
        { duration: 250, easing: Easing.inOut(Easing.quad) },
        finished => {
          if (finished && callback) scheduleOnRN(callback);
        },
      );
    },
    [fadeAnim, sheetHeight, slideAnim],
  );

  useEffect(() => {
    // 收起键盘/旋转设备会改变窗口高度；退出途中不能重新开始入场动画。
    if (!closingRef.current) animate(true);
  }, [animate]);

  const close = useCallback(
    (saved = false) => {
      if (closingRef.current || !mountedRef.current) return;
      closingRef.current = true;
      setClosing(true);
      Keyboard.dismiss();
      animate(false, () => {
        if (!mountedRef.current) return;
        if (saved) onSaved();
        onClose();
      });
    },
    [animate, onClose, onSaved],
  );

  const requestClose = useCallback(() => {
    if (closingRef.current || busyRef.current || getCourseColorOperationPending()) return;
    close();
  }, [close]);

  const backgroundStyle = useAnimatedStyle(() => ({ opacity: fadeAnim.value }));
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: slideAnim.value }] }));

  const validation = useMemo(() => {
    if (!jsonText.trim()) return { colors: null, error: '' };
    try {
      return { colors: parseCourseColorsJson(jsonText), error: '' };
    } catch (error) {
      return { colors: null, error: error instanceof Error ? error.message : '颜色格式不正确，请检查 JSON。' };
    }
  }, [jsonText]);
  const nameValidation = useMemo(() => {
    try {
      return { name: validateCourseColorSchemeName(name), error: '' };
    } catch (error) {
      return { name: '', error: name ? (error instanceof Error ? error.message : '请输入配色名称。') : '' };
    }
  }, [name]);
  const updateJsonText = useCallback((value: string) => {
    setJsonText(value);
    setOperationError('');
  }, []);

  const handlePaste = useCallback(async () => {
    if (closingRef.current || busyRef.current || getCourseColorOperationPending() || isLoading || loadError) return;
    busyRef.current = true;
    const lifecycleVersion = lifecycleVersionRef.current;
    const isActive = () => mountedRef.current && lifecycleVersionRef.current === lifecycleVersion;
    setOperation('paste');
    setOperationError('');
    try {
      const value = await Clipboard.getString();
      if (!isActive()) return;
      if (!value.trim()) setOperationError('剪贴板中没有文本，请复制颜色后重试。');
      else if (value.length > MAX_COURSE_COLOR_SCHEME_JSON_LENGTH)
        setOperationError(`颜色文本不能超过 ${MAX_COURSE_COLOR_SCHEME_JSON_LENGTH} 个字符。`);
      else updateJsonText(value);
    } catch {
      if (isActive()) setOperationError('读取剪贴板失败，请长按输入框手动粘贴。');
    } finally {
      busyRef.current = false;
      if (mountedRef.current) setOperation(null);
    }
  }, [isLoading, loadError, updateJsonText]);

  const handleSave = useCallback(async () => {
    if (closingRef.current || busyRef.current || isLoading || loadError || !validation.colors || !nameValidation.name)
      return;
    const finish = beginCourseColorOperation();
    if (!finish) return;
    busyRef.current = true;
    const lifecycleVersion = lifecycleVersionRef.current;
    const isActive = () => mountedRef.current && lifecycleVersionRef.current === lifecycleVersion;
    setOperation('save');
    setOperationError('');
    try {
      const palette = await saveCourseColorScheme({
        id: savedIdRef.current,
        name: nameValidation.name,
        colors: validation.colors,
      });
      // 写入成功立即保留身份，避免重复保存生成第二套方案。
      savedIdRef.current = palette.id;
      let refreshed = true;
      await queryClient.invalidateQueries({ queryKey: [COURSE_PAGE_ALL_DATA_KEY] }).catch(() => {
        refreshed = false;
      });
      if (isActive()) {
        if (refreshed) toast.success(`已保存「${palette.name}」`);
        else toast.warning('配色已保存，课表刷新失败，请返回课表下拉刷新。');
        close(true);
      }
    } catch (error) {
      if (isActive()) setOperationError(error instanceof Error ? error.message : '保存失败，请稍后重试。');
    } finally {
      busyRef.current = false;
      finish();
      if (mountedRef.current) setOperation(null);
    }
  }, [close, isLoading, loadError, nameValidation.name, validation.colors]);

  const handleDelete = useCallback(async () => {
    const savedId = savedIdRef.current;
    if (closingRef.current || busyRef.current || isLoading || loadError || !savedId) return;
    const finish = beginCourseColorOperation();
    if (!finish) return;
    busyRef.current = true;
    const lifecycleVersion = lifecycleVersionRef.current;
    const isActive = () => mountedRef.current && lifecycleVersionRef.current === lifecycleVersion;
    setOperation('delete');
    setOperationError('');
    let switchedToDefault = false;
    try {
      const settings = await getCourseSetting();
      if (settings.colorScheme === savedId) {
        await updateCourseSetting({ colorScheme: DEFAULT_COURSE_COLOR_SCHEME });
        switchedToDefault = true;
      }
      await deleteCourseColorScheme(savedId);
      deletedRef.current = true;
      let refreshed = true;
      await queryClient.invalidateQueries({ queryKey: [COURSE_PAGE_ALL_DATA_KEY] }).catch(() => {
        refreshed = false;
      });
      if (isActive()) {
        if (refreshed) toast.success('配色已删除');
        else toast.warning('配色已删除，课表刷新失败，请返回课表下拉刷新。');
        close(true);
      }
    } catch {
      if (switchedToDefault)
        await queryClient.invalidateQueries({ queryKey: [COURSE_PAGE_ALL_DATA_KEY] }).catch(() => {});
      if (isActive())
        setOperationError(switchedToDefault ? '已切换为经典配色，删除失败，请重试。' : '删除配色失败，请重试。');
    } finally {
      busyRef.current = false;
      finish();
      if (mountedRef.current) {
        setOperation(null);
        if (!isActive()) setRetryCount(count => count + 1);
      }
    }
  }, [close, isLoading, loadError]);

  const confirmDelete = useCallback(() => {
    if (closingRef.current || busyRef.current || getCourseColorOperationPending() || isLoading) return;
    if (!savedIdRef.current) {
      close();
      return;
    }
    if (loadError) return;
    const palette = getCourseColorSchemes().find(item => item.id === savedIdRef.current);
    const lifecycleVersion = lifecycleVersionRef.current;
    Alert.alert('删除配色', `确定删除「${palette?.name ?? name}」吗？若正在使用这套配色，将切换为经典配色。`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => {
          if (mountedRef.current && lifecycleVersionRef.current === lifecycleVersion) return handleDelete();
        },
      },
    ]);
  }, [close, handleDelete, isLoading, loadError, name]);

  const disabled = isClosing || isLoading || !!loadError || operation !== null || isMutating;
  const errorMessage = operationError || nameValidation.error || validation.error;
  const saveDisabled = disabled || !validation.colors || !nameValidation.name;
  return (
    <Modal visible transparent navigationBarTranslucent statusBarTranslucent onRequestClose={requestClose}>
      <KeyboardAvoidingView className="flex-1 justify-end" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Animated.View className="absolute h-full w-full" style={backgroundStyle}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="关闭配色编辑"
            disabled={operation !== null || isMutating || isClosing}
            className="flex-1 bg-[#00000050]"
            onPress={requestClose}
          />
        </Animated.View>
        <Animated.View
          className="overflow-hidden rounded-t-3xl bg-background"
          style={[styles.sheet, { height: sheetHeight }, sheetStyle]}
        >
          <View className="flex-row items-center justify-between px-5 pb-2 pt-4">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="删除配色"
              accessibilityState={{ disabled }}
              disabled={disabled}
              hitSlop={8}
              className="h-11 w-11 items-center justify-center active:opacity-60"
              onPress={confirmDelete}
            >
              <DeletePaletteIcon width={24} height={24} color="#EF4444" opacity={disabled ? 0.4 : 1} />
            </Pressable>
            <Text className="text-xl font-bold text-primary" accessibilityRole="header">
              编辑课程配色
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="保存配色"
              accessibilityState={{ disabled: saveDisabled, busy: operation === 'save' }}
              disabled={saveDisabled}
              hitSlop={8}
              className="h-11 w-11 items-center justify-center active:opacity-60"
              onPress={handleSave}
            >
              {operation === 'save' ? (
                <ActivityIndicator />
              ) : (
                <SavePaletteIcon width={24} height={24} color="#1089FF" opacity={saveDisabled ? 0.4 : 1} />
              )}
            </Pressable>
          </View>
          <KeyboardAwareScrollView
            className="flex-1 px-6"
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            bottomOffset={24}
          >
            <SafeAreaView edges={['bottom']}>
              {isLoading ? (
                <View className="items-center gap-3 py-8">
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
                  <Input
                    accessibilityLabel="配色名称"
                    className="rounded-lg border border-border bg-card px-4"
                    value={name}
                    onChangeText={value => {
                      setName(value);
                      setOperationError('');
                    }}
                    editable={!disabled}
                    placeholder="配色名称（最多 8 个汉字）"
                    autoCorrect={false}
                    returnKeyType="done"
                  />
                  <Text className="mb-4 mt-2 text-right text-xs text-text-secondary">
                    {getCourseColorSchemeNameLength(name.trim())} / {MAX_COURSE_COLOR_SCHEME_NAME_LENGTH}
                  </Text>
                  <View className="mb-4 flex-row gap-2">
                    <Button className="m-0 flex-1" variant="outline" disabled={disabled} onPress={handlePaste}>
                      <Text>{operation === 'paste' ? '读取中…' : '从剪贴板粘贴'}</Text>
                    </Button>
                    <Button
                      className="m-0"
                      variant="ghost"
                      disabled={disabled}
                      onPress={() => updateJsonText(EXAMPLE_JSON)}
                    >
                      <Text>填入示例</Text>
                    </Button>
                  </View>
                  <Input
                    accessibilityLabel="配色颜色"
                    className="native:text-base mb-4 rounded-lg border border-border bg-card p-4 text-sm"
                    style={styles.input}
                    value={jsonText}
                    onChangeText={updateJsonText}
                    multiline
                    autoCapitalize="none"
                    autoCorrect={false}
                    spellCheck={false}
                    editable={!disabled}
                    placeholder={'[\n  "#81B8D8",\n  "#8FC8BC",\n  …\n]\n\n粘贴 25 种颜色，也可粘贴 colors 字段'}
                  />
                  {!!errorMessage && (
                    <Text className="mb-4 text-sm leading-6 text-destructive" accessibilityRole="alert">
                      {errorMessage}
                    </Text>
                  )}
                  {validation.colors && (
                    <View className="mb-5 rounded-xl border border-border bg-card p-4">
                      <ColorPalettePreview name={name.trim() || '未命名配色'} colors={validation.colors} />
                    </View>
                  )}
                </>
              )}
            </SafeAreaView>
          </KeyboardAwareScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
