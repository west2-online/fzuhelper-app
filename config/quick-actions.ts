import type { RouterAction } from 'expo-quick-actions/router';

import quickActionsConfig from './quick-actions.json';

export type QuickActionPlatform = 'android' | 'harmony' | 'ios';

export function getQuickActionItems(platform: QuickActionPlatform): RouterAction[] {
  return quickActionsConfig.items.map(item => ({
    id: item.id,
    title: item.title,
    subtitle: item.subtitle,
    icon: item.platforms[platform].icon,
    params: item.params,
  }));
}
