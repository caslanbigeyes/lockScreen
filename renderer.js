// renderer.js — 主窗口渲染逻辑

// ---- Tab 切换 ----
const tabButtons = document.querySelectorAll(".tab-nav button");
const tabPanels = document.querySelectorAll(".tab-panel");

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.tab;
    tabButtons.forEach((b) => b.classList.remove("active"));
    tabPanels.forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`tab-${target}`).classList.add("active");

    // 切换到统计 tab 时刷新数据
    if (target === "stats") {
      requestStatsUpdate();
    }
  });
});

// ---- 专注 Tab 元素 ----
const statusText = document.getElementById("statusText");
const timerText = document.getElementById("timerText");
const hintText = document.getElementById("hintText");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");

// ---- 统计 Tab 元素 ----
const scoreValue = document.getElementById("scoreValue");
const behaviorTag = document.getElementById("behaviorTag");
const statUnlock = document.getElementById("statUnlock");
const statForced = document.getElementById("statForced");
const statDelay = document.getElementById("statDelay");
const statMathErr = document.getElementById("statMathErr");
const statSessions = document.getElementById("statSessions");
const statFocusMin = document.getElementById("statFocusMin");
const openDetailStats = document.getElementById("openDetailStats");
const refreshStats = document.getElementById("refreshStats");

// ---- 设置 Tab 元素 ----
const focusMinutes = document.getElementById("focusMinutes");
const captureEnabled = document.getElementById("captureEnabled");
const mathGateEnabled = document.getElementById("mathGateEnabled");
const apiBase = document.getElementById("apiBase");
const apiToken = document.getElementById("apiToken");
const licenseInput = document.getElementById("licenseInput");
const setLicenseBtn = document.getElementById("setLicenseBtn");
const exportReportBtn = document.getElementById("exportReportBtn");

// ---- 状态 ----
let focusDurationMs = 1 * 60 * 1000;
let warningLeadMs = 30 * 1000;
let focusStartTime = null;
let displayInterval = null;
let cameraStream = null;

// ---- 工具函数 ----
const formatTime = (ms) => {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

// ---- 摄像头 & 拍照 ----
const ensureCamera = async () => {
  if (cameraStream) return;
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
  } catch {}
};

const capturePhoto = async () => {
  await ensureCamera();
  if (!cameraStream) return;
  const video = document.createElement("video");
  video.srcObject = cameraStream;
  await video.play();
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const data = canvas.toDataURL("image/jpeg", 0.8);
  if (data) {
    window.pro.savePhoto(data);
  }
};

// ---- 计时器显示 ----
const updateTimerDisplay = () => {
  if (!focusStartTime) {
    timerText.textContent = formatTime(focusDurationMs);
    return;
  }
  const elapsed = Date.now() - focusStartTime;
  const remaining = Math.max(focusDurationMs - elapsed, 0);
  timerText.textContent = formatTime(remaining);

  if (remaining <= warningLeadMs && remaining > 0) {
    statusText.textContent = "即将锁屏";
  }
  if (remaining === 0) {
    statusText.textContent = "已触发锁屏";
  }
};

const startDisplayTick = () => {
  if (displayInterval) clearInterval(displayInterval);
  updateTimerDisplay();
  displayInterval = setInterval(updateTimerDisplay, 1000);
};

const stopDisplayTick = () => {
  if (displayInterval) {
    clearInterval(displayInterval);
    displayInterval = null;
  }
};

// ---- 专注控制 ----
startBtn.addEventListener("click", () => {
  window.lockscreen.startFocus();
});

stopBtn.addEventListener("click", () => {
  window.lockscreen.stopFocus();
  focusStartTime = null;
  statusText.textContent = "已停止";
  stopDisplayTick();
  updateTimerDisplay();
});

// ---- IPC 监听：专注 ----
window.lockscreen.onFocusStarted((data) => {
  focusDurationMs = data.durationMs;
  focusStartTime = Date.now();
  statusText.textContent = "专注进行中";
  hintText.textContent = "到点后锁屏（约5分钟），解锁后需答题继续";
  startDisplayTick();
});

window.lockscreen.onWarningStatus((data) => {
  if (data.remainingMs) {
    statusText.textContent = "剩余30秒，准备锁屏";
  }
});

window.lockscreen.onFocusStopped(() => {
  focusStartTime = null;
  statusText.textContent = "等待开始";
  stopDisplayTick();
  updateTimerDisplay();
});

window.lockscreen.onLockStatus((data) => {
  if (data.isLocking) {
    statusText.textContent = "锁屏中";
    hintText.textContent = "锁屏已触发，稍后可继续使用电脑";
  } else {
    statusText.textContent = "锁屏结束";
    hintText.textContent = "可以再次开始专注";
  }
});

// ---- IPC 监听：拍照 ----
if (window.pro && window.pro.onCapturePhoto) {
  window.pro.onCapturePhoto(() => {
    capturePhoto();
  });
}

// ---- 统计刷新 ----
const requestStatsUpdate = () => {
  if (window.pro && window.pro.requestStats) window.pro.requestStats();
};

if (window.pro && window.pro.onStats) {
  window.pro.onStats((data) => {
    const now = new Date();
    const k = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const d = data && data[k] ? data[k] : {};
    statUnlock.textContent = String(d.unlockCount || 0);
    statForced.textContent = String(d.forcedLockCount || 0);
    statDelay.textContent = String(d.delayScore || 0);
    statMathErr.textContent = String(d.mathErrorCount || 0);
    statSessions.textContent = String(d.focusSessions || 0);
    statFocusMin.textContent = String(Math.round((d.totalFocusMs || 0) / 60000));
  });
}

// 综合拖延指数和行为模式（来自 full-stats）
if (window.stats && window.stats.onFullStats) {
  window.stats.onFullStats((data) => {
    scoreValue.textContent = String(data.weightedScore || 0);
    const score = data.weightedScore || 0;
    if (score >= 50) {
      scoreValue.style.color = "#f87171";
    } else if (score >= 25) {
      scoreValue.style.color = "#fbbf24";
    } else if (score >= 10) {
      scoreValue.style.color = "#60a5fa";
    } else {
      scoreValue.style.color = "#4ade80";
    }

    const bMap = {
      "正常型": "b-normal",
      "冲动型": "b-impulse",
      "抗拒型": "b-resist",
      "假专注型": "b-fake",
      "数据不足": "b-nodata"
    };
    const behavior = data.behavior || "数据不足";
    behaviorTag.className = `behavior-badge ${bMap[behavior] || "b-nodata"}`;
    behaviorTag.textContent = behavior;
  });
}

refreshStats.addEventListener("click", () => {
  requestStatsUpdate();
  if (window.stats && window.stats.requestFullStats) {
    window.stats.requestFullStats();
  }
});

openDetailStats.addEventListener("click", () => {
  if (window.stats && window.stats.openStats) {
    window.stats.openStats();
  }
});

// ---- 设置 ----
const applySettingsUI = (s) => {
  if (!s) return;
  focusMinutes.value = String(s.focusMinutes || 1);
  captureEnabled.checked = !!s.captureEnabled;
  mathGateEnabled.checked = !!s.mathGateEnabled;
  if (s.apiBase) apiBase.value = s.apiBase;
  if (s.apiToken) apiToken.value = s.apiToken;
};

if (window.pro && window.pro.onSettings) {
  window.pro.onSettings((data) => {
    applySettingsUI(data);
  });
}

focusMinutes.addEventListener("change", () => {
  const v = Number(focusMinutes.value);
  if (window.pro && window.pro.setSettings) {
    window.pro.setSettings({ focusMinutes: v });
  }
});

captureEnabled.addEventListener("change", () => {
  if (window.pro && window.pro.setSettings) {
    window.pro.setSettings({ captureEnabled: captureEnabled.checked });
  }
});

mathGateEnabled.addEventListener("change", () => {
  if (window.pro && window.pro.setSettings) {
    window.pro.setSettings({ mathGateEnabled: mathGateEnabled.checked });
  }
});

apiBase.addEventListener("change", () => {
  if (window.pro && window.pro.setSettings) {
    window.pro.setSettings({ apiBase: apiBase.value.trim() });
  }
});

apiToken.addEventListener("change", () => {
  if (window.pro && window.pro.setSettings) {
    window.pro.setSettings({ apiToken: apiToken.value.trim() });
  }
});

setLicenseBtn.addEventListener("click", () => {
  const key = String(licenseInput.value || "").trim();
  if (window.pro && window.pro.setLicense) window.pro.setLicense(key);
});

exportReportBtn.addEventListener("click", () => {
  if (window.stats && window.stats.exportReport) {
    window.stats.exportReport();
  }
});

// ---- 初始化 ----
if (window.pro && window.pro.getSettings) window.pro.getSettings();
if (window.pro && window.pro.requestStats) window.pro.requestStats();
