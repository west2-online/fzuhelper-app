const fs = require('fs');
const path = require('path');
const { withDangerousMod } = require('@expo/config-plugins');

const KEEP_XML_FILE_NAME = 'com_helper_west2ol_fzuhelper_keep.xml';
// r8 keep住桌面长按入口的图标资源
const KEEP_XML_CONTENT = `<?xml version="1.0" encoding="utf-8"?>
<resources xmlns:tools="http://schemas.android.com/tools"
    tools:keep="@mipmap/qrcode,@mipmap/qrcode_foreground,@mipmap/qrcode_round" />`;

module.exports = config =>
  withDangerousMod(config, [
    'android',
    async mod => {
      const rawResDir = path.join(mod.modRequest.platformProjectRoot, 'app', 'src', 'main', 'res', 'raw');
      const keepXmlPath = path.join(rawResDir, KEEP_XML_FILE_NAME);

      fs.mkdirSync(rawResDir, { recursive: true });
      fs.writeFileSync(keepXmlPath, KEEP_XML_CONTENT, 'utf8');

      return mod;
    },
  ]);
