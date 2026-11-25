import { Stack } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import { useTheme } from '@/components/app-theme-provider';
import ColorPalettePreview from '@/components/course/color-palette-preview';
import PageContainer from '@/components/page-container';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { coursePalettes, type CourseColorScheme } from '@/lib/palettes';
import { cn } from '@/lib/utils';

export default function CourseColorsPage() {
  const { courseColorScheme: selectedId, loadCourseColorScheme, setCourseColorScheme } = useTheme();
  const [isSaving, setSaving] = useState(false);

  const handleSelect = async (id: CourseColorScheme) => {
    if (isSaving || id === selectedId) return;
    setSaving(true);
    try {
      await setCourseColorScheme(id);
      toast.success('课程配色已更新');
    } catch {
      toast.error('切换配色失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: '课程配色' }} />
      <PageContainer>
        <ScrollView className="flex-1 px-6" contentContainerClassName="py-6">
          <SafeAreaView edges={['bottom']}>
            {selectedId === undefined ? (
              <View className="items-center gap-3 py-8" accessibilityLiveRegion="polite">
                <ActivityIndicator />
                <Text className="text-text-secondary">正在读取配色…</Text>
              </View>
            ) : selectedId === null ? (
              <View className="gap-3 py-4">
                <Text className="text-destructive" accessibilityRole="alert">
                  读取课程配色失败，请重试。
                </Text>
                <Button variant="outline" onPress={loadCourseColorScheme}>
                  <Text>重试</Text>
                </Button>
              </View>
            ) : (
              Object.entries(coursePalettes).map(([id, { name, colors }]) => (
                <Pressable
                  key={id}
                  accessibilityRole="radio"
                  accessibilityLabel={name}
                  accessibilityState={{ checked: selectedId === id, disabled: isSaving }}
                  disabled={isSaving}
                  className={cn(
                    'mb-3 rounded-xl border border-border bg-card p-4 active:opacity-80',
                    selectedId === id && 'border-primary',
                    isSaving && 'opacity-60',
                  )}
                  onPress={() => handleSelect(id as CourseColorScheme)}
                >
                  <ColorPalettePreview name={name} colors={colors} />
                </Pressable>
              ))
            )}
          </SafeAreaView>
        </ScrollView>
      </PageContainer>
    </>
  );
}
