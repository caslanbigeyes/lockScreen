// license.js — LemonSqueezy 许可证管理模块（SRP：单一职责）
// 封装试用期管理、在线激活/验证/停用、离线缓存容忍

const fs = require("fs");
const path = require("path");
const { app } = require("electron");

const LICENSE_FILE = path.join(app.getPath("userData"), "license.json");
const LEMONSQUEEZY_API = "https://api.lemonsqueezy.com";
const STORE_ID = process.env.LEMONSQUEEZY_STORE_ID || "";
const PURCHASE_URL = process.env.PURCHASE_URL || "https://www.goofish.com/item?id=1026146077023";

// 试用期 7 天，缓存有效期 7 天
const TRIAL_DAYS = 7;
const CACHE_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 小时

let licenseData = null;
let periodicTimer = null;

/**
 * 默认许可证数据结构
 */
const defaultData = () => ({
  key: "",
  instanceId: "",
  firstLaunchAt: Date.now(),
  status: "trial",
  lastValidatedAt: 0,
  lastValidationResult: null,
});

/**
 * 从磁盘读取许可证数据，首次启动自动写入 firstLaunchAt
 */
const load = () => {
  try {
    const raw = fs.readFileSync(LICENSE_FILE, "utf-8");
    licenseData = Object.assign(defaultData(), JSON.parse(raw) || {});
  } catch {
    licenseData = defaultData();
    save(licenseData);
  }
  return licenseData;
};

/**
 * 持久化到磁盘
 */
const save = (data) => {
  licenseData = data || licenseData;
  try {
    fs.writeFileSync(LICENSE_FILE, JSON.stringify(licenseData, null, 2), "utf-8");
  } catch (err) {
    console.error("license.save error:", err.message);
  }
};

/**
 * 试用期是否仍有效
 */
const isTrialActive = () => {
  if (!licenseData) load();
  return licenseData.firstLaunchAt + TRIAL_DAYS * MS_PER_DAY > Date.now();
};

/**
 * 试用期剩余天数（0~7）
 */
const getTrialDaysLeft = () => {
  if (!licenseData) load();
  const remaining = licenseData.firstLaunchAt + TRIAL_DAYS * MS_PER_DAY - Date.now();
  return Math.max(0, Math.ceil(remaining / MS_PER_DAY));
};

/**
 * 缓存是否仍有效（闲鱼模式：永久有效）
 */
const isCacheValid = () => {
  if (!licenseData) load();
  // 闲鱼模式：本地激活后永久有效，不需要定期在线验证
  return licenseData.lastValidationResult === true;
};

/**
 * 核心判断：是否为 Pro 用户
 * 1. status === "active" && 缓存有效 → true
 * 2. status === "trial" && 试用期有效 → true
 * 3. 否则 → false
 */
const isPro = () => {
  if (!licenseData) load();
  if (licenseData.status === "active" && isCacheValid()) return true;
  if (licenseData.status === "trial" && isTrialActive()) return true;
  return false;
};

/**
 * 获取完整状态信息（供 UI 渲染）
 */
const getStatus = () => {
  if (!licenseData) load();
  const pro = isPro();
  const trialDaysLeft = getTrialDaysLeft();
  let message = "";

  if (licenseData.status === "active" && isCacheValid()) {
    message = "Pro 已激活";
  } else if (licenseData.status === "active" && !isCacheValid()) {
    message = "许可证需要重新验证，请连接网络";
  } else if (licenseData.status === "trial" && isTrialActive()) {
    message = `试用期：剩余 ${trialDaysLeft} 天`;
  } else {
    message = "试用已到期，升级 Pro 解锁全部功能";
  }

  return {
    isPro: pro,
    status: licenseData.status,
    trialDaysLeft,
    message,
    key: licenseData.key ? licenseData.key.slice(0, 8) + "..." : "",
  };
};

/**
 * LemonSqueezy API 调用封装
 */
const lemonRequest = async (endpoint, body) => {
  const url = `${LEMONSQUEEZY_API}/v1/licenses/${endpoint}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
};

/**
 * 激活许可证（闲鱼模式 - 本地验证）
 */
const activate = async (licenseKey) => {
  if (!licenseKey || !licenseKey.trim()) {
    return { success: false, error: "请输入许可证密钥" };
  }

  // 确保已加载许可证数据
  if (!licenseData) load();

  const key = licenseKey.trim().toUpperCase(); // 统一转为大写
  
  // 验证密钥格式：XXXX-XXXX-XXXX-XXXX
  const keyPattern = /^[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/;
  if (!keyPattern.test(key)) {
    return { 
      success: false, 
      error: "密钥格式不正确，应为：XXXX-XXXX-XXXX-XXXX（例如：5B9A-212C-54D7-ADE5）" 
    };
  }

  // 检查是否已经激活过其他密钥
  if (licenseData.key && licenseData.key !== key && licenseData.status === "active") {
    return { 
      success: false, 
      error: "此设备已激活其他密钥。如需更换，请先停用当前密钥。" 
    };
  }

  // 本地激活（闲鱼模式）
  licenseData.key = key;
  licenseData.instanceId = require("os").hostname();
  licenseData.status = "active";
  licenseData.lastValidatedAt = Date.now();
  licenseData.lastValidationResult = true;
  save();

  return { success: true };
};

/**
 * 验证许可证（闲鱼模式 - 本地验证）
 */
const validate = async () => {
  if (!licenseData || !licenseData.key) {
    return { valid: false, error: "无许可证密钥" };
  }

  // 本地验证：检查密钥格式
  const keyPattern = /^[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/;
  const valid = keyPattern.test(licenseData.key);

  licenseData.lastValidatedAt = Date.now();
  licenseData.lastValidationResult = valid;

  if (valid) {
    licenseData.status = "active";
  } else {
    licenseData.status = "expired";
  }
  
  save();
  return { valid, error: valid ? null : "密钥格式不正确" };
};

/**
 * 停用许可证（闲鱼模式 - 本地清除）
 */
const deactivate = async () => {
  if (!licenseData || !licenseData.key) {
    return { success: false };
  }

  // 本地清除许可证信息
  licenseData.key = "";
  licenseData.instanceId = "";
  licenseData.status = isTrialActive() ? "trial" : "expired";
  licenseData.lastValidatedAt = 0;
  licenseData.lastValidationResult = null;
  save();
  return { success: true };
};

/**
 * 通知主窗口许可证状态变更
 */
const notifyWindow = (mainWindow) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("license-changed", getStatus());
  }
};

/**
 * 启动时初始化：加载许可证数据（闲鱼模式）
 */
const init = async (mainWindow) => {
  load();

  // 试用期过期且无有效许可证 → 标记 expired
  if (licenseData.status === "trial" && !isTrialActive()) {
    licenseData.status = "expired";
    save();
  }

  // 闲鱼模式：不需要在线验证，本地激活后永久有效
  notifyWindow(mainWindow);
};

/**
 * 定期检查（闲鱼模式：禁用在线验证）
 */
const startPeriodicCheck = (mainWindow) => {
  // 闲鱼模式不需要定期在线验证
  // 本地激活后永久有效
  if (periodicTimer) clearInterval(periodicTimer);
  periodicTimer = null;
};

module.exports = {
  load,
  save,
  isPro,
  isTrialActive,
  getTrialDaysLeft,
  getStatus,
  activate,
  validate,
  deactivate,
  init,
  startPeriodicCheck,
  PURCHASE_URL,
};
