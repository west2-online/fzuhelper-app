import type { ColorSchemeName } from 'react-native';

type ParsedColorScheme = 'light' | 'dark';

type StringScript = string;
type GeneratedScript = (colorScheme: ParsedColorScheme) => string;
type Script = StringScript | GeneratedScript;

const commonScript: StringScript = `
  (function() {
    // 设置 viewport
    const metaViewport = document.createElement("meta");
    metaViewport.name = "viewport";
    metaViewport.content = "width=device-width,initial-scale=1.0";
    document.head.appendChild(metaViewport);

    // 删除所有 table 的 width 属性
    document.querySelectorAll("table").forEach((table) => {
      table.removeAttribute("width");
      table.style.width = "100%";
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

    // 滚动到顶部
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 200);
  })();
`;

const teachingProgramScript: StringScript = `
  (function() {
    // 适用年级区域自动换行
    const lbBtElement = document.getElementById("LB_bt");
    if (lbBtElement) {
      lbBtElement.style.wordBreak = "break-all";
    }
  })();
`;

type ColorData = {
  backgroundColor: string;
  backgroundHighlightColor: string;
  color: string;
  backgroundColorAlpha: string;
};

const colors: Record<ParsedColorScheme, ColorData> = {
  light: {
    backgroundColor: '#ffffff',
    backgroundHighlightColor: '#efefef',
    color: '#000000',
    backgroundColorAlpha: 'ff',
  },
  dark: {
    backgroundColor: '#121212',
    backgroundHighlightColor: '#1e1e1e',
    color: '#ffffff',
    backgroundColorAlpha: '20',
  },
};

const darkModeScript: GeneratedScript = colorScheme => `
  (function() {
    // 设置页面背景颜色
    document.documentElement.style.colorScheme = "${colorScheme}";
    document.body.style.backgroundColor = "${colors[colorScheme].backgroundColor}";
    document.body.style.color = "${colors[colorScheme].color}";

    // 删除所有 bgcolor 为 #FFFFFF 或 ffffff 的属性
    document.querySelectorAll("[bgcolor='#FFFFFF'], [bgcolor='ffffff']").forEach((element) => {
      element.removeAttribute("bgcolor");
    });

    document.querySelectorAll("table").forEach((table) => {
      table.removeAttribute("bgcolor");
      table.style.backgroundColor = "${colors[colorScheme].backgroundColor}";
    });

    document.querySelectorAll("tr").forEach((tr) => {
      if (!tr.bgColor) {
        // 设置表格行的背景颜色
        tr.style.backgroundColor = "${colors[colorScheme].backgroundColor}";
      } else if (/[\\w]{6}/.test(tr.bgColor)) {
        // 表格高亮行的背景颜色
        tr.style.backgroundColor = '#' + tr.bgColor + '${colors[colorScheme].backgroundColorAlpha}';
        tr.removeAttribute("bgcolor");
      } else {
        tr.style.color = 'black';
      }
    });
  })();
`;

const pyjhDarkModeScript: GeneratedScript = colorScheme => `
  (function() {
    document.querySelectorAll("[bgcolor='efefef']").forEach((element) => {
      element.removeAttribute("bgcolor");
      element.style.backgroundColor = "${colors[colorScheme].backgroundHighlightColor}";
    });
  })();
`;

const ratioScript: StringScript = `
(function() {
    if ('zoom' in document.body.style) {
        document.body.style.zoom = 1.5;
    } 
})();
`;

const termXuankeDetailScript: StringScript = `
(function() {
    // 找到第一个style包含width:1000px;的table并去除该style中的width属性
    const tables = document.querySelectorAll('table');
    for (let i = 0; i < tables.length; i++) {
        const table = tables[i];
        const style = table.getAttribute('style');
        if (style && style.includes('width:1000px;')) {
            const newStyle = style.replace(/width:\\s*1000px;?/i, '');
            table.setAttribute('style', newStyle);
            break;
        }
    }
    // 找到所有含style="width:180px;"的select并修改
    const selects = document.querySelectorAll('select');
    selects.forEach((select) => {
        const style = select.getAttribute('style');
        if (style && style.includes('width:180px;')) {
            const newStyle = style.replace(/width:\\s*180px;?/i, 'width:80px;');
            select.setAttribute('style', newStyle);
        }
    });
    // 教材购买方式，连续两个<br>代表空教材，可以直接删除
    document.body.innerHTML = document.body.innerHTML.replace(/(<br>\\s*){2,}/g, '');
})();
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
  // 学期选课详情页
  'https://jwcjwxt2.fzu.edu.cn:81/student/glxk/xqxk/xqxk_kclist.aspx': [ratioScript, termXuankeDetailScript],
  // 其他选课页面
  'https://jwcjwxt2.fzu.edu.cn:81/student/glxk/': [ratioScript],
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

export const getGeoLocationJS = () => {
  const getCurrentPosition = `
    navigator.geolocation.getCurrentPosition = (success, error, options) => {
      window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'getCurrentPosition', options: options }));

      window.addEventListener('message', (e) => {
        let eventData = {}
        try {
          eventData = JSON.parse(e.data);
        } catch (e) {}

        if (eventData.event === 'currentPosition') {
          success(eventData.data);
        } else if (eventData.event === 'currentPositionError') {
          error(eventData.data);
        }
      });
    };
    true;
  `;

  const watchPosition = `
    navigator.geolocation.watchPosition = (success, error, options) => {
      window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'watchPosition', options: options }));

      window.addEventListener('message', (e) => {
        let eventData = {}
        try {
          eventData = JSON.parse(e.data);
        } catch (e) {}

        if (eventData.event === 'watchPosition') {
          success(eventData.data);
        } else if (eventData.event === 'watchPositionError') {
          error(eventData.data);
        }
      });
    };
    true;
  `;

  const clearWatch = `
    navigator.geolocation.clearWatch = (watchID) => {
      window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'clearWatch', watchID: watchID }));
    };
    true;
  `;

  return `
    (function() {
      ${getCurrentPosition}
      ${watchPosition}
      ${clearWatch}
    })();
  `;
};
