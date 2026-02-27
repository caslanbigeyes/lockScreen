// stats.js — 统计可视化页面脚本（纯 Canvas 绘制图表）

const behaviorBadge = document.getElementById("behaviorBadge");
const weightedScoreEl = document.getElementById("weightedScore");
const sUnlock = document.getElementById("sUnlock");
const sForced = document.getElementById("sForced");
const sMathErr = document.getElementById("sMathErr");
const sQuickUnlock = document.getElementById("sQuickUnlock");
const sSessions = document.getElementById("sSessions");
const sTotalFocus = document.getElementById("sTotalFocus");
const focusCanvas = document.getElementById("focusChart");
const delayCanvas = document.getElementById("delayChart");

/**
 * 获取最近 N 天的日期键
 */
const getRecentDayKeys = (n) => {
  const keys = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    keys.push(key);
  }
  return keys;
};

/**
 * 获取日期的短标签（MM/DD）
 */
const shortLabel = (key) => {
  const parts = key.split("-");
  return `${parseInt(parts[1])}/${parseInt(parts[2])}`;
};

/**
 * 绘制柱状图
 */
const drawBarChart = (canvas, labels, values, color) => {
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = rect.height;
  const padding = { top: 10, bottom: 30, left: 40, right: 10 };
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;

  ctx.clearRect(0, 0, w, h);

  const maxVal = Math.max(...values, 1);
  const barCount = labels.length;
  const barWidth = chartW / barCount * 0.6;
  const barGap = chartW / barCount * 0.4;

  // Y轴刻度
  ctx.fillStyle = "#7f8897";
  ctx.font = "11px sans-serif";
  ctx.textAlign = "right";
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + chartH - (chartH * i / 4);
    const val = Math.round(maxVal * i / 4);
    ctx.fillText(String(val), padding.left - 6, y + 4);
    ctx.strokeStyle = "#2b2f3a";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(w - padding.right, y);
    ctx.stroke();
  }

  // 柱子
  values.forEach((val, i) => {
    const x = padding.left + (chartW / barCount) * i + barGap / 2;
    const barH = (val / maxVal) * chartH;
    const y = padding.top + chartH - barH;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, barWidth, barH, 4);
    ctx.fill();

    // X轴标签
    ctx.fillStyle = "#7f8897";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(labels[i], x + barWidth / 2, h - 8);
  });
};

/**
 * 绘制折线图
 */
const drawLineChart = (canvas, labels, values, color) => {
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = rect.height;
  const padding = { top: 10, bottom: 30, left: 40, right: 10 };
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;

  ctx.clearRect(0, 0, w, h);

  const maxVal = Math.max(...values, 1);

  // Y轴刻度
  ctx.fillStyle = "#7f8897";
  ctx.font = "11px sans-serif";
  ctx.textAlign = "right";
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + chartH - (chartH * i / 4);
    const val = Math.round(maxVal * i / 4);
    ctx.fillText(String(val), padding.left - 6, y + 4);
    ctx.strokeStyle = "#2b2f3a";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(w - padding.right, y);
    ctx.stroke();
  }

  // 折线
  const points = values.map((val, i) => ({
    x: padding.left + (chartW / (values.length - 1 || 1)) * i,
    y: padding.top + chartH - (val / maxVal) * chartH
  }));

  // 填充区域
  ctx.beginPath();
  ctx.moveTo(points[0].x, padding.top + chartH);
  points.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(points[points.length - 1].x, padding.top + chartH);
  ctx.closePath();
  ctx.fillStyle = color + "20";
  ctx.fill();

  // 线条
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  points.forEach((p, i) => {
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.stroke();

  // 点
  points.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  });

  // X轴标签
  ctx.fillStyle = "#7f8897";
  ctx.font = "11px sans-serif";
  ctx.textAlign = "center";
  labels.forEach((label, i) => {
    const x = padding.left + (chartW / (labels.length - 1 || 1)) * i;
    ctx.fillText(label, x, h - 8);
  });
};

/**
 * 行为模式 badge 样式映射
 */
const setBehaviorBadge = (type) => {
  const map = {
    "正常型": { cls: "badge-normal", text: "正常型" },
    "冲动型": { cls: "badge-impulse", text: "冲动型" },
    "抗拒型": { cls: "badge-resist", text: "抗拒型" },
    "假专注型": { cls: "badge-fake", text: "假专注型" },
    "数据不足": { cls: "badge-nodata", text: "数据不足" }
  };
  const m = map[type] || map["数据不足"];
  behaviorBadge.className = `badge ${m.cls}`;
  behaviorBadge.textContent = m.text;
};

/**
 * 渲染全部数据
 */
const render = (data) => {
  if (!data) return;

  const allStats = data.stats || {};
  const weightedScore = data.weightedScore || 0;
  const behavior = data.behavior || "数据不足";
  const todayKey = data.todayKey || "";

  // 综合指数
  weightedScoreEl.textContent = String(weightedScore);
  if (weightedScore >= 50) {
    weightedScoreEl.style.color = "#f87171";
  } else if (weightedScore >= 25) {
    weightedScoreEl.style.color = "#fbbf24";
  } else if (weightedScore >= 10) {
    weightedScoreEl.style.color = "#60a5fa";
  } else {
    weightedScoreEl.style.color = "#4ade80";
  }

  // 行为模式
  setBehaviorBadge(behavior);

  // 今日数据
  const today = allStats[todayKey] || {};
  sUnlock.textContent = String(today.unlockCount || 0);
  sForced.textContent = String(today.forcedLockCount || 0);
  sMathErr.textContent = String(today.mathErrorCount || 0);
  sQuickUnlock.textContent = String(today.quickUnlockCount || 0);
  sSessions.textContent = String(today.focusSessions || 0);
  sTotalFocus.textContent = String(Math.round((today.totalFocusMs || 0) / 60000));

  // 7 天图表数据
  const keys = getRecentDayKeys(7);
  const labels = keys.map(shortLabel);

  const focusValues = keys.map(k => {
    const d = allStats[k];
    return d ? Math.round((d.totalFocusMs || 0) / 60000) : 0;
  });

  const delayValues = keys.map(k => {
    const d = allStats[k];
    return d ? (d.delayScore || 0) : 0;
  });

  drawBarChart(focusCanvas, labels, focusValues, "#3d7eff");
  drawLineChart(delayCanvas, labels, delayValues, "#f59e0b");
};

// 监听完整统计数据
if (window.stats && window.stats.onFullStats) {
  window.stats.onFullStats((data) => {
    render(data);
  });
}

// 请求数据
if (window.stats && window.stats.requestFullStats) {
  window.stats.requestFullStats();
}
