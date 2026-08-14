'use strict';

const { DeviceEventEmitter, TurboModuleRegistry } = require('react-native');

const EXPO_MODULE_NAME = 'ExpoQuickActions';
const NATIVE_MODULE_NAME = 'ExpoQuickActionsHarmony';
const QUICK_ACTION_EVENT = 'ExpoQuickActions.onQuickAction';
const MAX_SHORTCUT_COUNT = 4;

function parseAction(payload) {
  if (typeof payload !== 'string' || payload.length === 0) {
    return undefined;
  }

  let action;
  try {
    action = JSON.parse(payload);
  } catch (error) {
    throw new Error(`Invalid HarmonyOS quick action payload: ${error.message}`);
  }

  if (!action || typeof action !== 'object' || typeof action.id !== 'string' || typeof action.title !== 'string') {
    throw new Error('Invalid HarmonyOS quick action payload: expected an action with string id and title');
  }
  return action;
}

function comparableAction(action) {
  return {
    id: action.id,
    icon: action.icon ?? null,
    params: action.params ?? null,
    subtitle: action.subtitle ?? null,
    title: action.title,
  };
}

function sameAction(left, right) {
  return JSON.stringify(comparableAction(left)) === JSON.stringify(comparableAction(right));
}

function normalizeItems(items, staticItems) {
  if (items == null) {
    return [];
  }
  if (!Array.isArray(items)) {
    throw new TypeError('expo-quick-actions: setItems expected an array');
  }
  if (items.length > MAX_SHORTCUT_COUNT) {
    throw new RangeError(`expo-quick-actions: HarmonyOS supports at most ${MAX_SHORTCUT_COUNT} launcher shortcuts`);
  }

  const staticItemsById = new Map(staticItems.map(item => [item.id, item]));
  const ids = new Set();
  for (const item of items) {
    if (!item || typeof item.id !== 'string' || item.id.length === 0) {
      throw new TypeError('expo-quick-actions: every action must have a non-empty string id');
    }
    if (typeof item.title !== 'string' || item.title.length === 0) {
      throw new TypeError('expo-quick-actions: every action must have a non-empty string title');
    }
    if (ids.has(item.id)) {
      throw new Error(`expo-quick-actions: duplicate action id "${item.id}"`);
    }
    ids.add(item.id);

    const staticItem = staticItemsById.get(item.id);
    if (!staticItem) {
      throw new Error(
        `expo-quick-actions: action "${item.id}" is not declared in the build-time ` +
          'HarmonyOS quick-action catalogue. ' +
          'HarmonyOS does not provide a public API for creating launcher shortcuts at runtime.',
      );
    }
    if (!sameAction(item, staticItem)) {
      throw new Error(
        `expo-quick-actions: action "${item.id}" differs from its build-time HarmonyOS declaration. ` +
          'Titles, subtitles, icons and params cannot be changed at runtime on HarmonyOS.',
      );
    }
  }
  return Array.from(ids);
}

function installExpoQuickActions(staticItems) {
  if (!globalThis.expo?.NativeModule || !globalThis.expo?.modules) {
    throw new Error('The Expo global polyfill must be installed before ExpoQuickActions');
  }
  if (globalThis.expo.modules[EXPO_MODULE_NAME]) {
    return;
  }
  if (!Array.isArray(staticItems)) {
    throw new TypeError('ExpoQuickActions Harmony installer expected a static action array');
  }

  const nativeModule = TurboModuleRegistry.getEnforcing(NATIVE_MODULE_NAME);
  const ExpoNativeModule = globalThis.expo.NativeModule;

  class ExpoQuickActionsHarmonyModule extends ExpoNativeModule {
    constructor() {
      super();
      this.__expo_module_name__ = EXPO_MODULE_NAME;
      this.initial = parseAction(nativeModule.getInitialAction());
      this.maxCount = MAX_SHORTCUT_COUNT;
      this.nativeSubscription = undefined;
    }

    async isSupported() {
      return true;
    }

    async setItems(items = []) {
      const ids = normalizeItems(items, staticItems);
      const visibilityApplied = await nativeModule.setItems(
        ids,
        staticItems.map(item => item.id),
      );
      if (!visibilityApplied && ids.length !== staticItems.length) {
        throw new Error('expo-quick-actions: changing shortcut visibility requires HarmonyOS API 20 or newer');
      }
    }

    startObserving(eventName) {
      if (eventName !== 'onQuickAction' || this.nativeSubscription) {
        return;
      }
      this.nativeSubscription = DeviceEventEmitter.addListener(QUICK_ACTION_EVENT, payload => {
        const action = parseAction(payload);
        if (action) {
          this.emit('onQuickAction', action);
        }
      });
      nativeModule.startObserving();
    }

    stopObserving(eventName) {
      if (eventName !== 'onQuickAction') {
        return;
      }
      nativeModule.stopObserving();
      this.nativeSubscription?.remove();
      this.nativeSubscription = undefined;
    }
  }

  globalThis.expo.modules[EXPO_MODULE_NAME] = new ExpoQuickActionsHarmonyModule();
}

module.exports = { installExpoQuickActions };
