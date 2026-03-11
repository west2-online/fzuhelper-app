import PageContainer from '@/components/page-container';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { FeedbackManager } from '@/lib/feedback';
import { Stack } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';

export default function FeedbackTest() {
  const feedbackManager = useMemo(() => new FeedbackManager(), []);
  const [resultText, setResultText] = useState('');

  const runAll = useCallback(async (): Promise<void> => {
    setResultText('Running...');
    const methodNames = (Object.getOwnPropertyNames(feedbackManager) as (keyof FeedbackManager)[]).filter(
      (name): name is keyof FeedbackManager =>
        typeof (feedbackManager as unknown as Record<string, unknown>)[name] === 'function',
    );
    const lines = await Promise.all(
      methodNames
        .filter(method => !method.startsWith('_'))
        .map(async method => {
          const fn = (feedbackManager as unknown as Record<string, () => Promise<unknown> | unknown>)[method];
          const value = typeof fn === 'function' ? await Promise.resolve(fn.call(feedbackManager)) : '';
          return `${String(method)}: ${value}`;
        }),
    );
    setResultText(lines.join('\n'));
  }, [feedbackManager]);

  useEffect(() => {
    runAll();
  }, [runAll]);

  return (
    <>
      <Stack.Screen options={{ title: 'Feedback Test' }} />
      <PageContainer>
        <Button onPress={runAll}>
          <Text>Run All</Text>
        </Button>
        <Text>{resultText}</Text>
      </PageContainer>
    </>
  );
}
