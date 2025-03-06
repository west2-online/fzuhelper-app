const commonScript = `
  // 1. 在 head 中添加 meta
  const metaViewport = document.createElement("meta");
  metaViewport.name = "viewport";
  metaViewport.content = "width=device-width,initial-scale=1.0";
  document.head.appendChild(metaViewport);

  // 2. 删除所有 table 的 width 属性
  document.querySelectorAll("table").forEach((table) => {
    table.removeAttribute("width");
  });

  // 3. 删除所有 id 为 BT_print 的元素
  document.querySelectorAll("#BT_print").forEach((element) => {
    element.remove();
  });

  // 4. 对所有 td 元素的内容进行 trim 操作
  document.querySelectorAll("td").forEach((td) => {
    td.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        node.textContent = node.textContent.trim();
      }
    });
    
    td.style.wordBreak = "break-all";

    // 5. 修改 td 的 width 属性
    const widthValue = td.getAttribute("width");
    if (widthValue && /^[0-9]+$/.test(widthValue)) {
      // 确保 width 是一个纯数字
      const newWidthPercentage = (parseInt(widthValue, 10) / 800) * 100;
      td.setAttribute("width", newWidthPercentage.toFixed(2) + "%");
    }
  });
`;

const teachingProgramScript = `
  // 适用年级区域自动换行
  const lbBtElement = document.getElementById("LB_bt");
  if (lbBtElement) {
    lbBtElement.style.wordBreak = "break-all";
  }
`;

// url与脚本常量对应map
export const urlToScriptMap = {
  'https://jwcjwxt2.fzu.edu.cn:81/pyfa/skjh/TeachingPlan_view.aspx': commonScript,
  'https://jwcjwxt2.fzu.edu.cn:81/pyfa/jxdg/TeachingProgram_view.aspx': commonScript + teachingProgramScript,
  'https://jwcjwxt2.fzu.edu.cn:81/pyfa/pyjh/pyfa_bzy.aspx': commonScript,
};
