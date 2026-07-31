'use strict';

/* eslint-disable no-bitwise */

const { Buffer } = require('node:buffer');
const {
  copyFileSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} = require('node:fs');
const path = require('node:path');

const ACTION_PARAMETER_KEY = 'expo.modules.quickactions.SHORTCUT';
const MAX_SHORTCUT_COUNT = 4;
const MAX_PARAMETER_LENGTH = 1024;
const MAX_SHORTCUT_ID_BYTES = 63;

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function assertSerializableParams(params, actionId) {
  if (params == null) {
    return;
  }
  if (typeof params !== 'object' || Array.isArray(params)) {
    throw new TypeError(`Quick action "${actionId}" params must be an object`);
  }
  for (const [key, value] of Object.entries(params)) {
    if (
      value !== null &&
      value !== undefined &&
      typeof value !== 'string' &&
      typeof value !== 'number' &&
      typeof value !== 'boolean'
    ) {
      throw new TypeError(`Quick action "${actionId}" param "${key}" must be a string, number, boolean or null`);
    }
  }
}

function escapeNonAsciiForProfile(value) {
  return value.replace(/[^\x20-\x7e]/gu, character =>
    Array.from(character)
      .flatMap(codePointCharacter => {
        const codePoint = codePointCharacter.codePointAt(0);
        if (codePoint <= 0xffff) {
          return [`\\u${codePoint.toString(16).padStart(4, '0')}`];
        }
        const adjusted = codePoint - 0x10000;
        const high = 0xd800 + (adjusted >> 10);
        const low = 0xdc00 + (adjusted & 0x3ff);
        return [`\\u${high.toString(16).padStart(4, '0')}`, `\\u${low.toString(16).padStart(4, '0')}`];
      })
      .join(''),
  );
}

function validateItems(items) {
  if (!Array.isArray(items) || items.length > MAX_SHORTCUT_COUNT) {
    throw new Error(`HarmonyOS quick actions must be an array with at most ${MAX_SHORTCUT_COUNT} items`);
  }
  const ids = new Set();
  items.forEach((item, index) => {
    if (!item || typeof item.id !== 'string' || item.id.length === 0) {
      throw new TypeError(`Quick action at index ${index} must have a non-empty string id`);
    }
    if (Buffer.byteLength(item.id, 'utf8') > MAX_SHORTCUT_ID_BYTES) {
      throw new RangeError(`Quick action "${item.id}" id exceeds HarmonyOS's ${MAX_SHORTCUT_ID_BYTES}-byte limit`);
    }
    if (ids.has(item.id)) {
      throw new Error(`Duplicate quick action id "${item.id}"`);
    }
    ids.add(item.id);
    if (typeof item.title !== 'string' || item.title.length === 0) {
      throw new TypeError(`Quick action "${item.id}" must have a non-empty string title`);
    }
    if (item.subtitle != null && typeof item.subtitle !== 'string') {
      throw new TypeError(`Quick action "${item.id}" subtitle must be a string`);
    }
    if (typeof item.platforms?.harmony?.icon !== 'string' || item.platforms.harmony.icon.length === 0) {
      throw new TypeError(`Quick action "${item.id}" must define platforms.harmony.icon`);
    }
    if (typeof item.platforms?.harmony?.image !== 'string' || item.platforms.harmony.image.length === 0) {
      throw new TypeError(`Quick action "${item.id}" must define platforms.harmony.image`);
    }
    assertSerializableParams(item.params, item.id);
  });
}

function assertPng(filePath, actionId) {
  const signature = readFileSync(filePath).subarray(0, 8);
  const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (!signature.equals(pngSignature)) {
    throw new TypeError(`Quick action "${actionId}" platforms.harmony.image must be a PNG image`);
  }
}

function syncHarmonyQuickActions({ abilityName, bundleName, configPath, moduleName, projectDir, resourceRoot }) {
  const config = readJson(configPath);
  const items = config.items ?? [];
  validateItems(items);

  for (const [field, value] of Object.entries({
    abilityName,
    bundleName,
    moduleName,
    projectDir,
    resourceRoot,
  })) {
    if (typeof value !== 'string' || value.length === 0) {
      throw new TypeError(`syncHarmonyQuickActions requires a non-empty ${field}`);
    }
  }

  const mediaDir = path.join(resourceRoot, 'media');
  const elementDir = path.join(resourceRoot, 'element');
  const profileDir = path.join(resourceRoot, 'profile');
  const preparedItems = items.map((item, index) => {
    const resourceName = `expo_quick_action_${index}`;
    const sourceIcon = path.resolve(projectDir, item.platforms.harmony.image);
    assertPng(sourceIcon, item.id);

    const serializedAction = escapeNonAsciiForProfile(
      JSON.stringify({
        id: item.id,
        title: item.title,
        ...(item.subtitle == null ? {} : { subtitle: item.subtitle }),
        icon: item.platforms.harmony.icon,
        ...(item.params == null ? {} : { params: item.params }),
      }),
    );
    if (serializedAction.length > MAX_PARAMETER_LENGTH) {
      throw new Error(
        `Quick action "${item.id}" exceeds HarmonyOS's ${MAX_PARAMETER_LENGTH}-character parameter limit`,
      );
    }

    return { item, resourceName, serializedAction, sourceIcon };
  });

  const strings = preparedItems.map(({ item, resourceName }) => ({
    name: `${resourceName}_title`,
    value: item.title,
  }));
  const shortcuts = preparedItems.map(({ item, resourceName, serializedAction }) => ({
    shortcutId: item.id,
    label: `$string:${resourceName}_title`,
    icon: `$media:${resourceName}`,
    visible: true,
    wants: [
      {
        bundleName,
        moduleName,
        abilityName,
        parameters: {
          [ACTION_PARAMETER_KEY]: serializedAction,
        },
      },
    ],
  }));

  mkdirSync(resourceRoot, { recursive: true });
  const stagingRoot = mkdtempSync(path.join(resourceRoot, '.expo-quick-actions-'));
  const stagingMediaDir = path.join(stagingRoot, 'media');
  mkdirSync(stagingMediaDir);

  try {
    for (const { resourceName, sourceIcon } of preparedItems) {
      copyFileSync(sourceIcon, path.join(stagingMediaDir, `${resourceName}.png`));
    }
    writeFileSync(
      path.join(stagingRoot, 'expo_quick_actions.element.json'),
      `${JSON.stringify({ string: strings }, null, 2)}\n`,
    );
    writeFileSync(
      path.join(stagingRoot, 'expo_quick_actions.profile.json'),
      `${JSON.stringify({ shortcuts }, null, 2)}\n`,
    );

    mkdirSync(mediaDir, { recursive: true });
    mkdirSync(elementDir, { recursive: true });
    mkdirSync(profileDir, { recursive: true });
    const expectedMedia = new Set(preparedItems.map(({ resourceName }) => `${resourceName}.png`));
    for (const { resourceName } of preparedItems) {
      renameSync(path.join(stagingMediaDir, `${resourceName}.png`), path.join(mediaDir, `${resourceName}.png`));
    }
    for (const fileName of readdirSync(mediaDir)) {
      if (/^expo_quick_action_\d+\.png$/u.test(fileName) && !expectedMedia.has(fileName)) {
        unlinkSync(path.join(mediaDir, fileName));
      }
    }
    renameSync(
      path.join(stagingRoot, 'expo_quick_actions.element.json'),
      path.join(elementDir, 'expo_quick_actions.json'),
    );
    renameSync(
      path.join(stagingRoot, 'expo_quick_actions.profile.json'),
      path.join(profileDir, 'expo_quick_actions.json'),
    );
  } finally {
    rmSync(stagingRoot, { force: true, recursive: true });
  }
}

module.exports = { syncHarmonyQuickActions };
