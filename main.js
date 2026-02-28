const { app, BrowserWindow, ipcMain, powerMonitor, shell } = require("electron");
const path = require("path");
const { exec } = require("child_process");
const fs = require("fs");
const delayIndex = require("./delayIndex");
const photoCrypto = require("./crypto");
const license = require("./license");

app.commandLine.appendSwitch("no-sandbox");

let mainWindow;
let warningWindow;
let mathWindow;
let focusTimer = null;
let warningTimer;
let enforceInterval;
let lockStartTime = null;
let isLocking = false;
let wasLockedByApp = false;
let captureTimer = null;
let expectedAnswer = null;
let mathCountdownTimer = null;
let focusSessionStart = null;

const parseIntEnv = (name, def) => {
  const v = parseInt(process.env[name], 10);
  return Number.isFinite(v) && v > 0 ? v : def;
};
let focusDurationMs = parseIntEnv("FOCUS_MINUTES", 1) * 60 * 1000;
const lockDurationMs = parseIntEnv("LOCK_MINUTES", 5) * 60 * 1000;
const enforceIntervalMs = 3000;
const userDataDir = app.getPath("userData");
const photosDir = path.join(userDataDir, "photos");
const statsFile = path.join(userDataDir, "stats.json");
const licenseFile = path.join(userDataDir, "license.json");
const settingsFile = path.join(userDataDir, "settings.json");
let stats = {};
let settings = { focusMinutes: 1, captureEnabled: true, mathGateEnabled: true, apiBase: "", apiToken: "" };

const ensureDirs = () => {
  try {
    if (!fs.existsSync(photosDir)) fs.mkdirSync(photosDir, { recursive: true });
  } catch {}
};

const loadStats = () => {
  try {
    const raw = fs.readFileSync(statsFile, "utf-8");
    stats = JSON.parse(raw) || {};
  } catch {
    stats = {};
  }
};

const saveStats = () => {
  try {
    fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2), "utf-8");
    if (mainWindow) {
      mainWindow.webContents.send("stats-status", stats);
    }
  } catch {}
};

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const bumpDaily = (field) => {
  const key = todayKey();
  if (!stats[key]) stats[key] = {};
  stats[key] = delayIndex.ensureDayFields(stats[key]);
  stats[key][field] = (stats[key][field] || 0) + 1;
  delayIndex.updateDayMetrics(stats, key);
  saveStats();
};

const loadSettings = () => {
  try {
    const raw = fs.readFileSync(settingsFile, "utf-8");
    settings = Object.assign(settings, JSON.parse(raw) || {});
  } catch {}
  focusDurationMs = (settings.focusMinutes || 1) * 60 * 1000;
  if (mainWindow) {
    mainWindow.webContents.send("settings-status", settings);
  }
};

const saveSettings = (partial) => {
  settings = Object.assign(settings, partial || {});
  focusDurationMs = (settings.focusMinutes || 1) * 60 * 1000;
  try {
    fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2), "utf-8");
  } catch {}
  if (mainWindow) {
    mainWindow.webContents.send("settings-status", settings);
  }
};

const apiEnabled = () => {
  return !!settings.apiBase && !!settings.apiToken;
};

const postJson = async (pathUrl, body) => {
  try {
    const url = `${settings.apiBase}${pathUrl}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${settings.apiToken}`
      },
      body: JSON.stringify(body || {})
    });
    return res.ok;
  } catch {
    return false;
  }
};

const syncStatsToday = async () => {
  if (!apiEnabled()) return;
  const key = todayKey();
  const data = stats[key] || { unlockCount: 0, forcedLockCount: 0, delayScore: 0 };
  await postJson("/api/stats/today", { date: key, ...data });
};

const syncPhotoBase64 = async (base64) => {
  if (!apiEnabled() || !base64) return;
  await postJson("/api/photos", { image: base64, ts: Date.now() });
};

const createMainWindow = () => {
  mainWindow = new BrowserWindow({
    width: 520,
    height: 560,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));
};

const destroyWarningWindow = () => {
  if (!warningWindow) {
    return;
  }
  warningWindow.removeAllListeners("close");
  warningWindow.close();
  warningWindow = null;
};

const clearTimers = () => {
  if (focusTimer) {
    clearTimeout(focusTimer);
    focusTimer = null;
  }
  if (warningTimer) {
    clearTimeout(warningTimer);
    warningTimer = null;
  }
  if (captureTimer) {
    clearTimeout(captureTimer);
    captureTimer = null;
  }
  if (mathCountdownTimer) {
    clearTimeout(mathCountdownTimer);
    mathCountdownTimer = null;
  }
};

const createWarningWindow = () => {
  destroyWarningWindow();
  warningWindow = new BrowserWindow({
    fullscreen: true,
    alwaysOnTop: true,
    frame: false,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    closable: false,
    focusable: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  warningWindow.setMenu(null);
  warningWindow.on("close", (e) => {
    e.preventDefault();
  });
  warningWindow.loadFile(path.join(__dirname, "warning.html"));
  warningWindow.webContents.once("did-finish-load", () => {
    warningWindow.webContents.send("warning-start", { remainingMs: 30000 });
  });
  if (mainWindow) {
    mainWindow.webContents.send("warning-status", { remainingMs: 30000 });
  }
};

const performLock = () => {
  if (process.platform === "win32") {
    exec("rundll32.exe user32.dll,LockWorkStation");
  } else if (process.platform === "darwin") {
    exec("pmset displaysleepnow");
  }
};

/**
 * 根据 7 天综合拖延指数计算自适应策略
 */
const getAdaptiveStrategy = () => {
  const score = delayIndex.computeWeightedScore(stats);
  const behavior = delayIndex.identifyBehavior(stats);

  if (score >= 50) {
    return {
      mathLevel: 4,
      extraLockMs: 3 * 60 * 1000,
      doubleLock: true,
      forceCapture: true,
      score,
      behavior
    };
  } else if (score >= 25) {
    return {
      mathLevel: 3,
      extraLockMs: 3 * 60 * 1000,
      doubleLock: false,
      forceCapture: false,
      score,
      behavior
    };
  } else if (score >= 10) {
    return {
      mathLevel: 2,
      extraLockMs: 0,
      doubleLock: false,
      forceCapture: false,
      score,
      behavior
    };
  } else {
    return {
      mathLevel: 1,
      extraLockMs: 0,
      doubleLock: false,
      forceCapture: false,
      score,
      behavior
    };
  }
};

const enforceLock = () => {
  if (enforceInterval) {
    clearTimeout(enforceInterval);
  }
  enforceInterval = setTimeout(() => {
    lockStartTime = null;
    isLocking = false;
    if (mainWindow) {
      mainWindow.webContents.send("lock-status", {
        isLocking: false,
        remainingMs: 0
      });
    }
    enforceInterval = null;
  }, lockDurationMs);
};

const lockScreen = () => {
  destroyWarningWindow();

  // 记录本次专注时长
  if (focusSessionStart) {
    const duration = Date.now() - focusSessionStart;
    delayIndex.recordFocusSession(stats, todayKey(), duration);
    focusSessionStart = null;
    saveStats();
  }

  const BASE_STRATEGY = { mathLevel: 1, extraLockMs: 0, doubleLock: false, forceCapture: false, score: 0, behavior: "数据不足" };
  const strategy = license.isPro() ? getAdaptiveStrategy() : BASE_STRATEGY;
  currentMathLevel = strategy.mathLevel;
  const effectiveLockMs = lockDurationMs + strategy.extraLockMs;

  lockStartTime = Date.now();
  isLocking = true;
  wasLockedByApp = true;
  bumpDaily("forcedLockCount");

  // 强制拍照（高拖延指数时）
  if (strategy.forceCapture && mainWindow) {
    mainWindow.webContents.send("capture-photo");
  }

  performLock();

  // 使用自适应锁屏时长
  if (enforceInterval) {
    clearTimeout(enforceInterval);
  }
  enforceInterval = setTimeout(() => {
    lockStartTime = null;
    isLocking = false;
    if (mainWindow) {
      mainWindow.webContents.send("lock-status", {
        isLocking: false,
        remainingMs: 0
      });
    }
    enforceInterval = null;

    // 双重锁屏：解除后立即再次锁屏一次
    if (strategy.doubleLock) {
      setTimeout(() => {
        performLock();
      }, 2000);
    }
  }, effectiveLockMs);

  if (mainWindow) {
    mainWindow.webContents.send("lock-status", {
      isLocking: true,
      remainingMs: effectiveLockMs
    });
  }
};

const startFocus = () => {
  clearTimers();
  destroyWarningWindow();
  lockStartTime = null;
  isLocking = false;
  focusSessionStart = Date.now();

  // 应用自适应策略
  const BASE_STRATEGY = { mathLevel: 1, extraLockMs: 0, doubleLock: false, forceCapture: false, score: 0, behavior: "数据不足" };
  const strategy = license.isPro() ? getAdaptiveStrategy() : BASE_STRATEGY;
  currentMathLevel = strategy.mathLevel;

  const warningLeadMs = 30000;

  if (focusDurationMs > warningLeadMs) {
    // 在锁屏前 30 秒弹出警告窗口
    warningTimer = setTimeout(() => {
      createWarningWindow();
      // 警告 30 秒后触发锁屏
      focusTimer = setTimeout(() => {
        lockScreen();
      }, warningLeadMs);
    }, focusDurationMs - warningLeadMs);
  } else {
    // 专注时长 <= 30s，直接倒计时后锁屏
    warningTimer = setTimeout(() => {
      lockScreen();
    }, focusDurationMs);
  }

  if (license.isPro() && settings.captureEnabled && mainWindow) {
    const min = 5000;
    const max = Math.max(min, focusDurationMs - 5000);
    const delay = Math.floor(Math.random() * (max - min)) + min;
    captureTimer = setTimeout(() => {
      mainWindow.webContents.send("capture-photo");
    }, delay);
  }

  if (mainWindow) {
    mainWindow.webContents.send("focus-started", {
      durationMs: focusDurationMs
    });
  }
};

const stopFocus = () => {
  clearTimers();
  destroyWarningWindow();
  if (mainWindow) {
    mainWindow.webContents.send("focus-stopped");
  }
};

ipcMain.on("start-focus", () => {
  startFocus();
});

ipcMain.on("stop-focus", () => {
  stopFocus();
});

ipcMain.on("save-photo", (_, base64) => {
  if (!license.isPro()) return;
  try {
    const b64 = String(base64 || "");
    const idx = b64.indexOf("base64,");
    const raw = idx >= 0 ? b64.slice(idx + 7) : b64;
    const buf = Buffer.from(raw, "base64");
    // AES 加密后保存（扩展名 .enc 标识已加密）
    const encrypted = photoCrypto.encrypt(buf, license.load().key || "");
    const name = `photo_${Date.now()}.enc`;
    fs.writeFileSync(path.join(photosDir, name), encrypted);
  } catch {}
  syncPhotoBase64(base64);
});

ipcMain.on("request-stats", () => {
  if (mainWindow) mainWindow.webContents.send("stats-status", stats);
});

app.on("before-quit", (event) => {
  if (isLocking) {
    event.preventDefault();
  }
});

app.whenReady().then(async () => {
  ensureDirs();
  loadStats();
  loadSettings();
  createMainWindow();
  await license.init(mainWindow);
  license.startPeriodicCheck(mainWindow);
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });

  powerMonitor.on("unlock-screen", () => {
    if (wasLockedByApp) {
      wasLockedByApp = false;
      // 快速解锁检测：锁屏后 < 30s 解锁
      if (lockStartTime && (Date.now() - lockStartTime) < 30000) {
        bumpDaily("quickUnlockCount");
      }
      if (enforceInterval) {
        clearTimeout(enforceInterval);
        enforceInterval = null;
      }
      lockStartTime = null;
      isLocking = false;
      bumpDaily("unlockCount");
      if (mainWindow) {
        mainWindow.webContents.send("lock-status", {
          isLocking: false,
          remainingMs: 0
        });
      }
      if (license.isPro() && settings.mathGateEnabled) {
        const math = createMathWindow();
        math.once("ready-to-show", () => {
          math.show();
        });
      } else {
        startFocus();
      }
      syncStatsToday();
    }
  });
});

let currentMathLevel = 1;

const randomProblem = (level) => {
  level = level || currentMathLevel;
  let a, b, op, ans, display;

  switch (level) {
    case 1: // 两位数加减
      a = Math.floor(Math.random() * 90) + 10;
      b = Math.floor(Math.random() * 90) + 10;
      op = Math.random() < 0.5 ? "+" : "-";
      ans = op === "+" ? a + b : a - b;
      display = `${a} ${op} ${b}`;
      break;
    case 2: // 两位数乘法
      a = Math.floor(Math.random() * 90) + 10;
      b = Math.floor(Math.random() * 9) + 2;
      op = "*";
      ans = a * b;
      display = `${a} × ${b}`;
      break;
    case 3: // 三位数加减 + 两位数乘法混合
      if (Math.random() < 0.5) {
        a = Math.floor(Math.random() * 900) + 100;
        b = Math.floor(Math.random() * 900) + 100;
        op = Math.random() < 0.5 ? "+" : "-";
        ans = op === "+" ? a + b : a - b;
        display = `${a} ${op} ${b}`;
      } else {
        a = Math.floor(Math.random() * 90) + 10;
        b = Math.floor(Math.random() * 90) + 10;
        op = "*";
        ans = a * b;
        display = `${a} × ${b}`;
      }
      break;
    case 4: // 三位数混合运算、简单平方
    default:
      if (Math.random() < 0.3) {
        // 简单平方
        a = Math.floor(Math.random() * 20) + 5;
        ans = a * a;
        display = `${a}²`;
      } else if (Math.random() < 0.5) {
        // 三位数混合
        a = Math.floor(Math.random() * 900) + 100;
        b = Math.floor(Math.random() * 90) + 10;
        const c = Math.floor(Math.random() * 90) + 10;
        ans = a + b * c;
        display = `${a} + ${b} × ${c}`;
      } else {
        a = Math.floor(Math.random() * 900) + 100;
        b = Math.floor(Math.random() * 900) + 100;
        op = Math.random() < 0.5 ? "+" : "-";
        const c = Math.floor(Math.random() * 9) + 2;
        const sub = op === "+" ? a + b : a - b;
        ans = sub * c;
        display = `(${a} ${op} ${b}) × ${c}`;
      }
      break;
  }

  expectedAnswer = ans;
  console.log('=== 生成数学题 ===');
  console.log('题目:', display);
  console.log('答案:', ans, '(类型:', typeof ans, ')');
  console.log('难度:', level);
  console.log('================');
  return { display, level };
};

const closeMathWindow = () => {
  if (mathWindow) {
    mathWindow.removeAllListeners("close");
    mathWindow.close();
    mathWindow = null;
  }
  if (mathCountdownTimer) {
    clearTimeout(mathCountdownTimer);
    mathCountdownTimer = null;
  }
};

const createMathWindow = () => {
  closeMathWindow();
  const w = new BrowserWindow({
    fullscreen: true,
    alwaysOnTop: true,
    frame: false,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    closable: false,
    focusable: true,
    kiosk: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  mathWindow = w;
  w.setMenu(null);
  w.on("close", (e) => {
    e.preventDefault();
  });
  w.loadFile(path.join(__dirname, "math.html"));
  const p = randomProblem(currentMathLevel);
  w.webContents.once("did-finish-load", () => {
    w.webContents.send("math-problem", p);
    // 20 秒倒计时
    mathCountdownTimer = setTimeout(() => {
      // 超时视为答错
      bumpDaily("mathErrorCount");
      closeMathWindow();
      lockScreen();
    }, 20000);
  });
  return w;
};

ipcMain.on("math-answer", (_, payload) => {
  // 确保 payload 和 answer 存在
  if (!payload || payload.answer === undefined || payload.answer === null) {
    console.log('=== 数学答题验证 ===');
    console.log('无效的 payload:', payload);
    console.log('==================');
    return;
  }
  
  const userAnswer = Number(payload.answer);
  const pass = userAnswer === expectedAnswer;
  
  // 调试日志
  console.log('=== 数学答题验证 ===');
  console.log('Payload:', payload);
  console.log('用户答案:', userAnswer, '(类型:', typeof userAnswer, ')');
  console.log('正确答案:', expectedAnswer, '(类型:', typeof expectedAnswer, ')');
  console.log('是否通过:', pass);
  console.log('严格相等:', userAnswer === expectedAnswer);
  console.log('==================');
  
  if (pass) {
    closeMathWindow();
    expectedAnswer = null;
    startFocus();
  } else {
    // 答错：记录统计，关闭数学窗口，重新锁屏
    bumpDaily("mathErrorCount");
    closeMathWindow();
    expectedAnswer = null;
    lockScreen();
  }
});

ipcMain.on("set-settings", (_, data) => {
  saveSettings(data || {});
});

ipcMain.on("get-settings", () => {
  if (mainWindow) {
    mainWindow.webContents.send("settings-status", settings);
  }
});

// 统计窗口
let statsWindow = null;

const createStatsWindow = () => {
  if (statsWindow && !statsWindow.isDestroyed()) {
    statsWindow.focus();
    return;
  }
  statsWindow = new BrowserWindow({
    width: 680,
    height: 720,
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  statsWindow.loadFile(path.join(__dirname, "stats.html"));
  statsWindow.on("closed", () => {
    statsWindow = null;
  });
};

ipcMain.on("open-stats", () => {
  if (!license.isPro()) {
    if (mainWindow) mainWindow.webContents.send("pro-required", { feature: "详细统计图表" });
    return;
  }
  createStatsWindow();
});

ipcMain.on("request-full-stats", (event) => {
  const key = todayKey();
  const weightedScore = delayIndex.computeWeightedScore(stats);
  const behavior = delayIndex.identifyBehavior(stats);
  event.sender.send("full-stats", {
    stats,
    weightedScore,
    behavior,
    todayKey: key
  });
});

// PDF 周报导出
ipcMain.on("export-report", async () => {
  if (!license.isPro()) {
    if (mainWindow) mainWindow.webContents.send("pro-required", { feature: "PDF 周报导出" });
    return;
  }
  try {
    const report = require("./report");
    await report.exportPDF(stats, mainWindow);
  } catch (err) {
    console.error("PDF export error:", err);
  }
});

// ---- 许可证 IPC（invoke/handle 模式）----
ipcMain.handle("license:activate", async (_, key) => {
  const result = await license.activate(key);
  if (mainWindow) mainWindow.webContents.send("license-changed", license.getStatus());
  return result;
});

ipcMain.handle("license:getStatus", () => {
  return license.getStatus();
});

ipcMain.handle("license:deactivate", async () => {
  const result = await license.deactivate();
  if (mainWindow) mainWindow.webContents.send("license-changed", license.getStatus());
  return result;
});

// 安全地打开外部链接
ipcMain.on("open-external", (_, url) => {
  if (typeof url === "string" && (url.startsWith("https://") || url.startsWith("http://"))) {
    shell.openExternal(url);
  }
});

// 获取购买链接
ipcMain.handle("license:getPurchaseUrl", () => {
  return license.PURCHASE_URL;
});

// 打开购买窗口
ipcMain.on("open-purchase-window", () => {
  // 直接在浏览器中打开闲鱼链接
  const purchaseUrl = license.PURCHASE_URL;
  shell.openExternal(purchaseUrl);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
