const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("lockscreen", {
  startFocus: () => ipcRenderer.send("start-focus"),
  stopFocus: () => ipcRenderer.send("stop-focus"),
  onFocusStarted: (callback) => ipcRenderer.on("focus-started", (_, data) => callback(data)),
  onFocusStopped: (callback) => ipcRenderer.on("focus-stopped", () => callback()),
  onLockStatus: (callback) => ipcRenderer.on("lock-status", (_, data) => callback(data))
});

contextBridge.exposeInMainWorld("pro", {
  onCapturePhoto: (callback) => ipcRenderer.on("capture-photo", () => callback()),
  savePhoto: (base64) => ipcRenderer.send("save-photo", base64),
  setLicense: (key) => ipcRenderer.send("set-license", key),
  onLicense: (callback) => ipcRenderer.on("license-status", (_, data) => callback(data)),
  requestStats: () => ipcRenderer.send("request-stats"),
  onStats: (callback) => ipcRenderer.on("stats-status", (_, data) => callback(data)),
  getSettings: () => ipcRenderer.send("get-settings"),
  onSettings: (callback) => ipcRenderer.on("settings-status", (_, data) => callback(data)),
  setSettings: (data) => ipcRenderer.send("set-settings", data)
});

contextBridge.exposeInMainWorld("gate", {
  onProblem: (callback) => ipcRenderer.on("math-problem", (_, data) => callback(data)),
  submitAnswer: (payload) => ipcRenderer.send("math-answer", payload)
});
