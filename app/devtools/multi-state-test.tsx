import MultiStateView, { STATE } from '@/components/multistateview/multi-state-view';
import PageContainer from '@/components/page-container';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { toast } from 'sonner-native';

export default function MultiStateTest() {
  const [state, setState] = useState(STATE.EMPTY);

  return (
    <>
      <Stack.Screen options={{ title: 'MultiStateView Test' }} />
      <PageContainer>
        <Button onPress={() => setState(STATE.CONTENT)}>
          <Text>CONTENT</Text>
        </Button>
        <Button onPress={() => setState(STATE.EMPTY)}>
          <Text>EMPTY</Text>
        </Button>
        <Button onPress={() => setState(STATE.NO_NETWORK)}>
          <Text>NO_NETWORK</Text>
        </Button>
        <Button onPress={() => setState(STATE.ERROR)}>
          <Text>ERROR</Text>
        </Button>
        <Button onPress={() => setState(STATE.LOADING)}>
          <Text>LOADING</Text>
        </Button>
        {/* <View className="h-2/5 w-full" /> */}
        <MultiStateView
          state={state}
          content={<Text>Your content goes here</Text>}
          refresh={() => toast.info('加载数据')}
        />
      </PageContainer>
    </>
  );
}
