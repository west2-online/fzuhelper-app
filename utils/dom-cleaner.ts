import type { ColorSchemeName } from 'react-native';

type ParsedColorScheme = 'light' | 'dark';

type StringScript = string;
type GeneratedScript = (colorScheme: ParsedColorScheme) => string;
type Script = StringScript | GeneratedScript;

const commonScript: StringScript = `
  // 设置 viewport
  const metaViewport = document.createElement("meta");
  metaViewport.name = "viewport";
  metaViewport.content = "width=device-width,initial-scale=1.0";
  document.head.appendChild(metaViewport);

  // 删除所有 table 的 width 属性
  document.querySelectorAll("table").forEach((table) => {
    table.removeAttribute("width");
  });

  // 删除所有 id 为 BT_print 的元素
  document.querySelectorAll("#BT_print").forEach((element) => {
    element.remove();
  });

  document.querySelectorAll("td").forEach((td) => {
    // 对所有 td 元素的内容进行 trim 操作
    td.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        node.textContent = node.textContent.trim();
      }
    });

    // 设置 td 的 word-break 属性
    td.style.wordBreak = "break-all";

    // 修改 td 的 width 属性
    const widthValue = td.getAttribute("width");
    if (widthValue && /^[0-9]+$/.test(widthValue)) {
      // 确保 width 是一个纯数字
      const newWidthPercentage = (parseInt(widthValue, 10) / 800) * 100;
      td.setAttribute("width", newWidthPercentage.toFixed(2) + "%");
    }
  });
`;

const teachingProgramScript: StringScript = `
  // 适用年级区域自动换行
  const lbBtElement = document.getElementById("LB_bt");
  if (lbBtElement) {
    lbBtElement.style.wordBreak = "break-all";
  }
`;

type ColorData = {
  backgroundColor: string;
  backgroundHighlightColor?: string;
  color: string;
};

const colors: Record<ParsedColorScheme, ColorData> = {
  light: {
    backgroundColor: '#ffffff',
    backgroundHighlightColor: '#efefef',
    color: '#000000',
  },
  dark: {
    backgroundColor: '#121212',
    backgroundHighlightColor: '#1e1e1e',
    color: '#ffffff',
  },
};

const darkModeScript: GeneratedScript = colorScheme => `
  // 设置页面背景颜色
  document.documentElement.style.colorScheme = "${colorScheme}";
  document.body.style.backgroundColor = "${colors[colorScheme].backgroundColor}";
  document.body.style.color = "${colors[colorScheme].color}";

  // 删除所有 bgcolor 为 #FFFFFF 或 ffffff 的属性
  document.querySelectorAll("[bgcolor='#FFFFFF'], [bgcolor='ffffff']").forEach((element) => {
    element.removeAttribute("bgcolor");
  });

   document.querySelectorAll("tr").forEach((tr) => {
    if (!tr.bgColor) {
      // 设置表格行的背景颜色
      tr.style.backgroundColor = "${colors[colorScheme].backgroundColor}";
    } else {
      tr.style.color = "black";
    }
  });
`;

const pyjhDarkModeScript: GeneratedScript = colorScheme => `
  document.querySelectorAll("[bgcolor='efefef']").forEach((element) => {
    element.removeAttribute("bgcolor");
    element.style.backgroundColor = "${colors[colorScheme].backgroundHighlightColor}";
  });
`;

// url 与脚本常量对应 map
const urlToScriptMap: Record<string, Script[]> = {
  // 教学大纲
  'https://jwcjwxt2.fzu.edu.cn:81/pyfa/jxdg/TeachingProgram_view.aspx': [
    commonScript,
    teachingProgramScript,
    darkModeScript,
  ],
  // 授课计划
  'https://jwcjwxt2.fzu.edu.cn:81/pyfa/skjh/TeachingPlan_view.aspx': [commonScript, darkModeScript],
  // 培养计划
  'https://jwcjwxt2.fzu.edu.cn:81/pyfa/pyjh/pyfa_bzy.aspx': [commonScript, darkModeScript, pyjhDarkModeScript],
};

export const getScriptByURL = (url: string, colorScheme: ColorSchemeName) => {
  const matchedScripts = Object.keys(urlToScriptMap).filter(key => url.startsWith(key));
  const scripts = matchedScripts.map(key => urlToScriptMap[key]).flat();
  const parsedColorScheme: ParsedColorScheme = colorScheme === 'dark' ? 'dark' : 'light';

  const scriptToInject = scripts
    .map(script => (typeof script === 'function' ? script(parsedColorScheme) : script))
    .join('\n');

  return scriptToInject;
};
