// `@expo/metro-runtime` MUST be the first import to ensure Fast Refresh works on web.
import '@expo/metro-runtime';

import { App } from 'expo-router/build/qualified-entry';
import { renderRootComponent } from 'expo-router/build/renderRootComponent';
import { FeedbackManager } from './lib/feedback';

// 理论上需要等待初始化完毕，但await会导致卡白屏，目前测试已经覆盖到足够早的日志
FeedbackManager.getInstance().initLogger();

renderRootComponent(App);
