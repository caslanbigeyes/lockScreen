// report.js — PDF 周报导出模块
// 使用 Electron BrowserWindow.printToPDF 生成 PDF

const { BrowserWindow, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const delayIndex = require("./delayIndex");

/**
 * 导出 PDF 周报
 * @param {Object} stats - 全量统计数据
 * @param {BrowserWindow} parentWindow - 父窗口（用于 dialog）
 */
const exportPDF = async (stats, parentWindow) => {
  const days = delayIndex.getRecentDayKeys(7).reverse();
  const weightedScore = delayIndex.computeWeightedScore(stats);
  const behavior = delayIndex.identifyBehavior(stats);

  // 创建隐藏窗口加载模板
  const win = new BrowserWindow({
    width: 800,
    height: 1100,
    show: false,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: false
    }
  });

  await win.loadFile(path.join(__dirname, "report.html"));

  // 注入数据并执行渲染
  await win.webContents.executeJavaScript(`
    window.fillReport(${JSON.stringify({ stats, weightedScore, behavior, days })});
  `);

  // 等待渲染完成
  await new Promise(resolve => setTimeout(resolve, 500));

  // 生成 PDF
  const pdfBuffer = await win.webContents.printToPDF({
    marginsType: 0,
    printBackground: true,
    pageSize: "A4"
  });

  win.close();

  // 弹出保存对话框
  const defaultName = `FocusGuard周报_${days[0]}_${days[days.length - 1]}.pdf`;
  const result = await dialog.showSaveDialog(parentWindow, {
    title: "保存周报",
    defaultPath: defaultName,
    filters: [{ name: "PDF", extensions: ["pdf"] }]
  });

  if (result.canceled || !result.filePath) return;

  fs.writeFileSync(result.filePath, pdfBuffer);
};

module.exports = { exportPDF };
