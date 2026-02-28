const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("lockscreen", {
  startFocus: () => ipcRenderer.send("start-focus"),
  stopFocus: () => ipcRenderer.send("stop-focus"),
  onFocusStarted: (callback) => ipcRenderer.on("focus-started", (_, data) => callback(data)),
  onFocusStopped: (callback) => ipcRenderer.on("focus-stopped", () => callback()),
  onLockStatus: (callback) => ipcRenderer.on("lock-status", (_, data) => callback(data)),
  onWarningStatus: (callback) => ipcRenderer.on("warning-status", (_, data) => callback(data)),
  onWarningStart: (callback) => ipcRenderer.on("warning-start", (_, data) => callback(data))
});

contextBridge.exposeInMainWorld("pro", {
  onCapturePhoto: (callback) => ipcRenderer.on("capture-photo", () => callback()),
  savePhoto: (base64) => ipcRenderer.send("save-photo", base64),
  requestStats: () => ipcRenderer.send("request-stats"),
  onStats: (callback) => ipcRenderer.on("stats-status", (_, data) => callback(data)),
  getSettings: () => ipcRenderer.send("get-settings"),
  onSettings: (callback) => ipcRenderer.on("settings-status", (_, data) => callback(data)),
  setSettings: (data) => ipcRenderer.send("set-settings", data)
});

contextBridge.exposeInMainWorld("gate", {
  onProblem: (callback) => ipcRenderer.on("math-problem", (_, data) => callback(data)),
  submitAnswer: (payload) => ipcRenderer.send("math-answer", payload),
  onMathResult: (callback) => ipcRenderer.on("math-result", (_, data) => callback(data)),
  onMathCountdown: (callback) => ipcRenderer.on("math-countdown", (_, data) => callback(data))
});

contextBridge.exposeInMainWorld("stats", {
  openStats: () => ipcRenderer.send("open-stats"),
  requestFullStats: () => ipcRenderer.send("request-full-stats"),
  onFullStats: (callback) => ipcRenderer.on("full-stats", (_, data) => callback(data)),
  exportReport: () => ipcRenderer.send("export-report")
});

contextBridge.exposeInMainWorld("license", {
  activate: (key) => ipcRenderer.invoke("license:activate", key),
  getStatus: () => ipcRenderer.invoke("license:getStatus"),
  deactivate: () => ipcRenderer.invoke("license:deactivate"),
  getPurchaseUrl: () => ipcRenderer.invoke("license:getPurchaseUrl"),
  openPurchaseWindow: () => ipcRenderer.send("open-purchase-window"),
  onStatusChanged: (cb) => ipcRenderer.on("license-changed", (_, d) => cb(d)),
  onProRequired: (cb) => ipcRenderer.on("pro-required", (_, d) => cb(d)),
});

contextBridge.exposeInMainWorld("app", {
  openExternal: (url) => ipcRenderer.send("open-external", url),
});
