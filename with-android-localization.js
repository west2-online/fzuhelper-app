// https://github.com/mmomtchev/expo-android-localized-app-name/blob/main/index.js

const fs = require('fs');
const path = require('path');
const { withStringsXml, AndroidConfig } = require('@expo/config-plugins');
const xml2js = require('xml2js');
const builder = new xml2js.Builder({ headless: true });
const map = new Map([
  ['en', ''],
  ['zh-Hans', '-zh-rCN'],
  ['zh-Hant', '-zh-rTW'],
]);

function withAndroidLocalization(config) {
  return withStringsXml(config, async config => {
    const projectRoot = config.modRequest.projectRoot;
    const resPath = await AndroidConfig.Paths.getResourceFolderAsync(projectRoot);
    for (const locale of Object.keys(config.locales ?? {})) {
      const json = await fs.promises.readFile(config.locales[locale]);
      const strings = JSON.parse(json);
      const resources = [];
      for (const key of Object.keys(strings)) {
        // Skip values that are not marked for translation or simply do not exist
        // because gradle does not like them
        const untranslated = config.modResults.resources.string?.find(
          item => item.$.name === key && item.$.translatable !== false,
        );
        if (untranslated) resources.push({ string: { $: { name: key }, _: strings[key] } });
      }
      if (resources.length) {
        let value;
        if (!map.has(locale)) {
          value = `values-${locale}`;
        } else {
          value = `values${map.get(locale)}`;
        }
        const xmlpath = path.resolve(resPath, value, 'strings.xml');
        if (fs.existsSync(xmlpath)) {
          // do modification
          const xml = await fs.promises.readFile(xmlpath);
          const parsed = await xml2js.parseStringPromise(xml);
          // merge the two
          const existingResources = Array.isArray(parsed.resources.string)
            ? parsed.resources.string
            : [parsed.resources.string];
          const newResources = resources.map(item => {
            const existing = existingResources.find(existingItem => existingItem.$.name === item.string.$.name);
            if (existing) {
              existing._ = item.string._;
              return existing;
            }
            return item;
          });
          config.modResults.resources.string = Array.isArray(config.modResults.resources.string)
            ? newResources
            : newResources[0];
        } else {
          await fs.promises.mkdir(path.resolve(resPath, value), { recursive: true });
          await fs.promises.writeFile(xmlpath, builder.buildObject({ resources }));
        }
      }
    }
    return config;
  });
}

module.exports = withAndroidLocalization;
