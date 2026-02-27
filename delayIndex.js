// delayIndex.js — 拖延指数计算模块
// 职责：多维度评分、7 天权重衰减、行为模式识别

const WEIGHTS = [1.0, 0.85, 0.7, 0.55, 0.4, 0.25, 0.1];

/**
 * 确保日统计包含完整字段
 */
const ensureDayFields = (day) => {
  const defaults = {
    unlockCount: 0,
    forcedLockCount: 0,
    mathErrorCount: 0,
    quickUnlockCount: 0,
    avgFocusDuration: 0,
    focusSessions: 0,
    totalFocusMs: 0,
    delayScore: 0,
    behaviorType: ""
  };
  return Object.assign({}, defaults, day || {});
};

/**
 * 计算单日拖延指数
 */
const computeDayScore = (day) => {
  const d = ensureDayFields(day);

  // 冲动维度：频繁解锁 + 专注时间短
  const avgMin = d.focusSessions > 0
    ? (d.totalFocusMs / d.focusSessions) / 60000
    : 0;
  const impulseScore =
    (d.unlockCount > 3 ? d.unlockCount * 2 : 0) +
    (avgMin < 10 && d.focusSessions > 0 ? 5 : 0);

  // 逃避维度：数学题错误 + 强制锁屏
  const escapeScore = d.mathErrorCount * 3 + d.forcedLockCount * 2;

  // 抗拒维度：快速解锁
  const resistanceScore = d.quickUnlockCount * 4;

  return impulseScore + escapeScore + resistanceScore;
};

/**
 * 计算连续达标天数（delayScore < 10 视为达标）
 */
const getConsecutiveDays = (stats) => {
  const keys = getSortedDayKeys(stats);
  let count = 0;
  for (let i = keys.length - 1; i >= 0; i--) {
    const d = ensureDayFields(stats[keys[i]]);
    if (d.delayScore < 10) {
      count++;
    } else {
      break;
    }
  }
  return count;
};

/**
 * 获取按日期排序的键（最近在后）
 */
const getSortedDayKeys = (stats) => {
  return Object.keys(stats).sort();
};

/**
 * 获取最近 N 天的日期键
 */
const getRecentDayKeys = (n) => {
  const keys = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    keys.push(key);
  }
  return keys;
};

/**
 * 计算 7 天加权综合拖延指数
 */
const computeWeightedScore = (stats) => {
  const keys = getRecentDayKeys(7);
  let totalWeight = 0;
  let weightedSum = 0;

  keys.forEach((key, i) => {
    const day = stats[key];
    if (day) {
      const score = computeDayScore(day);
      const weight = WEIGHTS[i] || 0.1;
      weightedSum += score * weight;
      totalWeight += weight;
    }
  });

  if (totalWeight === 0) return 0;

  const raw = weightedSum / totalWeight;

  // 稳定性奖励：连续达标天数 * 2，最多 -10
  const consecutive = getConsecutiveDays(stats);
  const stabilityBonus = Math.min(consecutive * 2, 10);

  return Math.max(0, Math.round((raw - stabilityBonus) * 10) / 10);
};

/**
 * 行为模式识别
 */
const identifyBehavior = (stats) => {
  const keys = getRecentDayKeys(7);
  let totalUnlock = 0;
  let totalForcedLock = 0;
  let totalMathError = 0;
  let totalSessions = 0;
  let totalFocusMs = 0;
  let totalAvgDuration = 0;
  let dayCount = 0;

  keys.forEach((key) => {
    const d = ensureDayFields(stats[key]);
    if (stats[key]) {
      totalUnlock += d.unlockCount;
      totalForcedLock += d.forcedLockCount;
      totalMathError += d.mathErrorCount;
      totalSessions += d.focusSessions;
      totalFocusMs += d.totalFocusMs;
      totalAvgDuration += d.avgFocusDuration;
      dayCount++;
    }
  });

  if (dayCount === 0) return "数据不足";

  const avgSessionDuration = totalSessions > 0
    ? (totalFocusMs / totalSessions) / 60000
    : 0;

  // 冲动型：解锁次数高 + 平均专注时间短
  if (totalUnlock > dayCount * 3 && avgSessionDuration < 10) {
    return "冲动型";
  }

  // 抗拒型：数学题错误多 + 强制锁屏多
  if (totalMathError > dayCount * 2 && totalForcedLock > dayCount * 2) {
    return "抗拒型";
  }

  // 假专注型：专注次数多但总时长低
  if (totalSessions > dayCount * 4 && totalFocusMs < dayCount * 30 * 60000) {
    return "假专注型";
  }

  return "正常型";
};

/**
 * 更新单日的 delayScore 和 behaviorType
 */
const updateDayMetrics = (stats, dayKey) => {
  if (!stats[dayKey]) return;
  const d = ensureDayFields(stats[dayKey]);
  d.delayScore = computeDayScore(d);
  d.behaviorType = identifyBehavior(stats);

  // 计算平均专注时长
  if (d.focusSessions > 0) {
    d.avgFocusDuration = Math.round(d.totalFocusMs / d.focusSessions);
  }

  Object.assign(stats[dayKey], d);
};

/**
 * 记录一次专注完成
 */
const recordFocusSession = (stats, dayKey, durationMs) => {
  if (!stats[dayKey]) stats[dayKey] = {};
  const d = ensureDayFields(stats[dayKey]);
  d.focusSessions += 1;
  d.totalFocusMs += durationMs;
  d.avgFocusDuration = Math.round(d.totalFocusMs / d.focusSessions);
  Object.assign(stats[dayKey], d);
};

module.exports = {
  ensureDayFields,
  computeDayScore,
  computeWeightedScore,
  identifyBehavior,
  updateDayMetrics,
  recordFocusSession,
  getRecentDayKeys
};
