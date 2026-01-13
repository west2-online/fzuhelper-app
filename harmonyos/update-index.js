// +index.tsx仅在Static Rendering生效，这里手动修改
const fs = require('fs');
const filePath = './harmonyos/entry/src/main/resources/rawfile/bundle/index.html';
let html = fs.readFileSync(filePath, 'utf8');

// 1. 配置 Viewport
const newViewport =
  '<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover, user-scalable=no"/>';
const colorSchemeMeta = '<meta name="color-scheme" content="light dark"/>';
const noFavIcon = '<link rel="icon" href="data:,"/>';

// 移除已存在的 viewport meta 标签
const viewportRegex = /<meta\s+name="viewport"[\s\S]*?>/i;

if (viewportRegex.test(html)) {
  html = html.replace(viewportRegex, newViewport + '\n' + colorSchemeMeta + '\n' + noFavIcon);
} else {
  console.error('Viewport meta tag not found in index.html');
  process.exit(1);
}

// 2. 添加 Style
const styleContent = `
  <style>
      body {
          -webkit-user-select: none;
          user-select: none;
          background-color: #fff;
      }
      @media (prefers-color-scheme: dark) {
        body {
          background-color: #000;
        }
      }
  </style>`;

// 防止重复添加
if (!html.includes('background-color: #000')) {
  html = html.replace('</head>', styleContent + '\n</head>');
}

fs.writeFileSync(filePath, html, 'utf8');
console.log('Index.html updated successfully.');
