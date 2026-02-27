const { app, BrowserWindow, ipcMain, powerMonitor } = require("electron");
const path = require("path");
const { exec } = require("child_process");
const fs = require("fs");

app.commandLine.appendSwitch("no-sandbox");

let mainWindow;
let warningWindow;
let focusTimer = null;
let warningTimer;
let enforceInterval;
let lockStartTime = null;
let isLocking = false;
let wasLockedByApp = false;
let captureTimer = null;
let expectedAnswer = null;

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
let licenseEnabled = true;
let stats = {};
let settings = { focusMinutes: 1, captureEnabled: true, mathGateEnabled: true, apiBase: "", apiToken: "" };

const ensureDirs = () => {
  try {
    if (!fs.existsSync(photosDir)) fs.mkdirSync(photosDir, { recursive: true });
  } catch {}
};

const loadLicense = () => {
  try {
    const raw = fs.readFileSync(licenseFile, "utf-8");
    const data = JSON.parse(raw);
    licenseEnabled = !!data && !!data.key;
  } catch {
    licenseEnabled = true;
  }
};

const saveLicense = (key) => {
  try {
    fs.writeFileSync(licenseFile, JSON.stringify({ key }), "utf-8");
    licenseEnabled = !!key;
    if (mainWindow) {
      mainWindow.webContents.send("license-status", { enabled: licenseEnabled });
    }
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
  if (!stats[key]) stats[key] = { unlockCount: 0, forcedLockCount: 0, delayScore: 0 };
  stats[key][field] = (stats[key][field] || 0) + 1;
  stats[key].delayScore = (stats[key].unlockCount || 0) * 2 + (stats[key].forcedLockCount || 0) * 3;
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

const validateLicenseOnline = async (key) => {
  if (!settings.apiBase || !settings.apiToken || !key) return true;
  try {
    const ok = await postJson("/api/license/validate", { key });
    return ok;
  } catch {
    return true;
  }
};

const createMainWindow = () => {
  mainWindow = new BrowserWindow({
    width: 520,
    height: 420,
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
};

const performLock = () => {
  if (process.platform === "win32") {
    exec("rundll32.exe user32.dll,LockWorkStation");
  } else if (process.platform === "darwin") {
    exec("pmset displaysleepnow");
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
  lockStartTime = Date.now();
  isLocking = true;
  wasLockedByApp = true;
  bumpDaily("forcedLockCount");
  performLock();
  enforceLock();
  if (mainWindow) {
    mainWindow.webContents.send("lock-status", {
      isLocking: true,
      remainingMs: lockDurationMs
    });
  }
};

const startFocus = () => {
  clearTimers();
  destroyWarningWindow();
  lockStartTime = null;
  isLocking = false;

  warningTimer = setTimeout(() => {
    lockScreen();
  }, focusDurationMs);

  if (licenseEnabled && mainWindow) {
    const min = 5000;
    const max = Math.max(min, focusDurationMs - 5000);
    const delay = Math.floor(Math.random() * (max - min)) + min;
    if (settings.captureEnabled) {
      captureTimer = setTimeout(() => {
        mainWindow.webContents.send("capture-photo");
      }, delay);
    }
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
  try {
    const b64 = String(base64 || "");
    const idx = b64.indexOf("base64,");
    const raw = idx >= 0 ? b64.slice(idx + 7) : b64;
    const buf = Buffer.from(raw, "base64");
    const name = `photo_${Date.now()}.jpg`;
    fs.writeFileSync(path.join(photosDir, name), buf);
  } catch {}
  syncPhotoBase64(base64);
});

ipcMain.on("set-license", (_, key) => {
  saveLicense(key);
  validateLicenseOnline(key).then((ok) => {
    licenseEnabled = !!ok;
    if (mainWindow) {
      mainWindow.webContents.send("license-status", { enabled: licenseEnabled });
    }
  });
});

ipcMain.on("request-stats", () => {
  if (mainWindow) mainWindow.webContents.send("stats-status", stats);
});

app.on("before-quit", (event) => {
  if (isLocking) {
    event.preventDefault();
  }
});

app.whenReady().then(() => {
  ensureDirs();
  loadLicense();
  loadStats();
  loadSettings();
  createMainWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });

  powerMonitor.on("unlock-screen", () => {
    if (wasLockedByApp) {
      wasLockedByApp = false;
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
      if (settings.mathGateEnabled) {
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

const randomProblem = () => {
  const a = Math.floor(Math.random() * 40) + 10;
  const b = Math.floor(Math.random() * 40) + 10;
  const ops = ["+", "-", "*"];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let ans = 0;
  if (op === "+") ans = a + b;
  if (op === "-") ans = a - b;
  if (op === "*") ans = a * b;
  expectedAnswer = ans;
  return { a, b, op };
};

const createMathWindow = () => {
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
  w.setMenu(null);
  w.on("close", (e) => {
    e.preventDefault();
  });
  w.loadFile(path.join(__dirname, "math.html"));
  const p = randomProblem();
  w.webContents.once("did-finish-load", () => {
    w.webContents.send("math-problem", p);
  });
  return w;
};

ipcMain.on("math-answer", (_, payload) => {
  const pass = Number(payload && payload.answer) === expectedAnswer;
  if (pass) {
    const all = BrowserWindow.getAllWindows();
    const gate = all.find((x) => x !== mainWindow);
    if (gate) {
      gate.removeAllListeners("close");
      gate.close();
    }
    expectedAnswer = null;
    startFocus();
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

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
