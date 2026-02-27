const statusText = document.getElementById("statusText");
const timerText = document.getElementById("timerText");
const hintText = document.getElementById("hintText");
const focusMinutes = document.getElementById("focusMinutes");
const captureEnabled = document.getElementById("captureEnabled");
const mathGateEnabled = document.getElementById("mathGateEnabled");
const licenseInput = document.getElementById("licenseInput");
const setLicenseBtn = document.getElementById("setLicenseBtn");
const statUnlock = document.getElementById("statUnlock");
const statForced = document.getElementById("statForced");
const statDelay = document.getElementById("statDelay");
const refreshStats = document.getElementById("refreshStats");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");

let focusDurationMs = 1 * 60 * 1000;
let warningLeadMs = 30 * 1000;
let focusStartTime = null;
let displayInterval = null;

let cameraStream = null;

const formatTime = (ms) => {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
};

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
  if (displayInterval) {
    clearInterval(displayInterval);
  }
  updateTimerDisplay();
  displayInterval = setInterval(updateTimerDisplay, 1000);
};

const stopDisplayTick = () => {
  if (displayInterval) {
    clearInterval(displayInterval);
    displayInterval = null;
  }
};

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

if (window.pro && window.pro.onCapturePhoto) {
  window.pro.onCapturePhoto(() => {
    capturePhoto();
  });
}

const applySettingsUI = (s) => {
  if (!s) return;
  focusMinutes.value = String(s.focusMinutes || 1);
  captureEnabled.checked = !!s.captureEnabled;
  mathGateEnabled.checked = !!s.mathGateEnabled;
};

if (window.pro && window.pro.onSettings) {
  window.pro.onSettings((data) => {
    applySettingsUI(data);
  });
}

if (window.pro && window.pro.getSettings) window.pro.getSettings();
if (window.pro && window.pro.requestStats) window.pro.requestStats();

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

setLicenseBtn.addEventListener("click", () => {
  const key = String(licenseInput.value || "").trim();
  if (window.pro && window.pro.setLicense) window.pro.setLicense(key);
});

refreshStats.addEventListener("click", () => {
  if (window.pro && window.pro.requestStats) window.pro.requestStats();
});

if (window.pro && window.pro.onStats) {
  window.pro.onStats((data) => {
    const now = new Date();
    const k = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const d = data && data[k] ? data[k] : { unlockCount: 0, forcedLockCount: 0, delayScore: 0 };
    statUnlock.textContent = String(d.unlockCount || 0);
    statForced.textContent = String(d.forcedLockCount || 0);
    statDelay.textContent = String(d.delayScore || 0);
  });
}
window.lockscreen.onFocusStarted((data) => {
  focusDurationMs = data.durationMs;
  focusStartTime = Date.now();
  statusText.textContent = "专注进行中";
  hintText.textContent = "到点后锁屏（约5分钟），解锁后不再继续锁屏";
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
