import ComponentTestFramework, { type ComponentTestContentMode } from '@/components/devtools/component-test-framework';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { ScrollView, View } from 'react-native';

const LONG_ZH =
  '这是一段用于测试组件排版的长中文内容。它会持续换行，覆盖标题、正文、按钮、输入框和卡片区域，方便观察在窄屏、深色主题、自定义背景和键盘弹出时是否仍然保持清晰、稳定、可读。';

const LONG_EN =
  'This is a long English paragraph for component layout testing. It checks wrapping behavior, spacing, contrast, and control alignment across narrow screens, dark mode, custom backgrounds, and the keyboard-visible state.';

export default function ComponentTestPage() {
  return <ComponentTestFramework renderTarget={contentMode => <ComponentTestTarget contentMode={contentMode} />} />;
}

function ComponentTestTarget({ contentMode }: { contentMode: ComponentTestContentMode }) {
  const bodyText =
    contentMode === 'longZh'
      ? LONG_ZH
      : contentMode === 'longEn'
        ? LONG_EN
        : 'A compact sample for checking ordinary component density, contrast, spacing, and controls.';

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          <Text>Component Test - {contentMode}</Text>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollView className="mb-4 h-64">
          <Text className="mb-4">{bodyText}</Text>
          <Input placeholder="Type something..." className="mb-4" />
          <Button>
            <Text>Primary Action</Text>
          </Button>
        </ScrollView>
        <View className="rounded bg-gray-100 p-4">
          <Text>This is a card area to test background contrast and padding.</Text>
        </View>
      </CardContent>
    </Card>
  );
}
