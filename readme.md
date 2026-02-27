下面是一份为你的 **“FocusGuard 专注卫士”** 软件整理的完整需求文档（PRD），涵盖功能、技术、商业化及未来扩展，已经融合了前面讨论的锁屏、数学题验证、拍照和拖延指数系统。

---

# FocusGuard 完整需求文档（PRD）

---

## 一、产品概述

**FocusGuard** 是一款跨平台（Windows、macOS）的强制专注工具，旨在帮助用户防止拖延，提高工作效率。通过倒计时锁屏、随机拍照、数学题验证及拖延指数统计，形成闭环专注管理体系。

**核心价值**：

* 强制专注：锁屏不可取消，阻断干扰
* 行为评估：拖延指数计算与行为模式分析
* 自适应干预：根据拖延指数调整锁屏策略
* 数据驱动：统计、趋势分析和报告导出
* 商业化：Pro 订阅、企业版支持团队管理

---

## 二、目标用户

| 用户群体         | 需求痛点                |
| ------------ | ------------------- |
| 程序员 / 远程办公   | 容易沉迷社交媒体 / 刷视频，缺少自律 |
| 学生 / 考研 / 考公 | 无法持续长时间高效学习         |
| 自由职业者        | 缺乏外部监督，易拖延          |
| 企业团队         | 希望监控团队专注度，提高效率      |

---

## 三、核心功能模块

### 1️⃣ 专注强制系统

**功能描述**：

* 支持自定义专注时长（默认 40 分钟）
* 锁屏前 30 秒弹窗提醒
* 强制锁屏 5 分钟，不可取消
* 解锁后需完成数学题验证
* 随机拍照用于行为分析

**流程图**：

```text
开始专注
   ↓
剩余30秒 → 全屏提醒
   ↓
时间到 → 强制锁屏
   ↓
锁屏 5 分钟
   ↓
解锁 → 数学题验证 + 随机拍照
   ↓
验证通过 → 返回桌面
```

---

### 2️⃣ 数学题验证系统

* 题型：加减乘除、两位数乘法、简单函数运算
* 难度分级：1~4级（Pro 版支持高级）
* 限时 20 秒，答错需重新锁屏
* 用于防止快速跳过锁屏

---

### 3️⃣ 随机拍照系统

* 解锁时自动拍照
* 本地加密存储（AES）
* Pro 版可启用 AI 表情分析
* 企业版可用于团队专注数据分析

---

### 4️⃣ 拖延指数系统（V2）

#### 数据维度

| 维度   | 描述              |
| ---- | --------------- |
| 冲动行为 | 平均专注时间过短、连续解锁次数 |
| 逃避行为 | 重锁次数、数学题错误次数    |
| 抵抗行为 | 强制锁屏后快速解锁次数     |
| 稳定性  | 连续多天专注达标，降低评分   |

#### 评分公式

```
delayScore = impulseScore + escapeScore + resistanceScore - stabilityBonus
```

* 历史行为权重衰减：最近 7 天的数据权重更大
* 根据拖延指数自动调整锁屏策略：

  * 0–10 → 普通模式
  * 10–25 → 提升数学难度
  * 25–50 → 延长锁屏
  * 50+ → 双重锁屏 + 随机拍照

#### 行为模式识别

* 冲动型拖延：解锁频繁、专注短
* 抗拒型拖延：数学题错误多、重锁次数多
* 假专注型：表面专注，但频繁解锁

---

### 5️⃣ 数据统计与可视化

* 每日专注时长、解锁次数、强制锁次数、数学题错误次数
* 拖延指数曲线趋势
* 周报导出（PDF）
* 企业版排行榜及团队分析

---

### 6️⃣ 用户界面

* Dashboard：专注统计、今日拖延指数
* Focus Page：倒计时、锁屏触发
* Warning Page：锁屏前 30 秒提醒
* Verify Page：数学题输入
* Stats Page：数据可视化
* Settings Page：时间设置、拍照开关、通知设置

---

## 四、技术架构

### 客户端（Electron + React + TypeScript）

模块划分：

```
/desktop
├── electron/engines/        # Timer, Lock, Math, Camera, Stats
├── electron/services/       # FocusService, UnlockService, SyncService
├── renderer/pages/          # Dashboard, Focus, Warning, Verify, Stats, Settings
├── renderer/components/     # Countdown, MathInput, DelayChart, CameraPreview
├── renderer/store/          # FocusStore, StatsStore, UserStore
├── db/                      # SQLite + Repositories
└── utils/                   # Crypto, Logger, Constants
```

### 后端（Node + Prisma + PostgreSQL）

* 模块：Auth、Subscription、Sync、Stats、Admin
* 数据库结构：User、Subscription、FocusSession、UnlockRecord、DailyStat、Company、Team、TeamMember
* 功能：用户认证、订阅验证、数据同步、企业统计、排行榜生成

---

## 五、商业化设计

| 版本          | 功能                          |
| ----------- | --------------------------- |
| 免费          | 固定 40 分钟、基础数学题、拖延统计、无云同步    |
| Pro（29 元/月） | 自定义时间、拍照验证、云同步、周报、排行榜、数学题升级 |
| 企业版         | 团队管理、拖延分析、数据后台、API 接口、权限控制  |

---

## 六、权限与安全

* macOS：摄像头、辅助功能权限
* Windows：开机自启、进程守护
* 拍照数据本地 AES 加密
* 默认不上传云端，Pro/企业版可启用云同步

---

## 七、未来扩展

* AI 行为分析（表情识别、鼠标/键盘行为）
* 多设备锁屏联动
* 企业版 API 开放
* 智能推荐专注策略

---

## 八、产品增长策略

* 社交媒体短视频实验与展示
* 拖延指数挑战赛（刷屏营销）
* 企业团队订阅推广
* 学生群体优惠策略

---

![Image](https://images.sftcdn.net/images/t_app-cover-s%2Cf_auto/p/a7674771-0bc2-4d05-96c4-e1b87f9fcfe2/323390102/focusguard-ad-blocker-and-popup-blocker-screenshot)

![Image](https://d112y698adiu2z.cloudfront.net/photos/production/software_photos/004/321/285/datas/original.png)

![Image](https://images.macrumors.com/t/ZGuJRiKaOT4Umm1vP5K9Ogb7Ir8%3D/1600x/article-new/2022/06/ios-16-focus-lock-screen.jpg)

![Image](https://images.squarespace-cdn.com/content/v1/601a88b84db70c0088d55310/1666956532572-7P9RGW3M212KXKPY19HY/IMG_1652.jpg)

---

这个文档已经覆盖了：

* 功能模块（强制锁屏、数学验证、拍照、拖延指数 V2）
* 技术架构（客户端 + 后端 + 数据库）
* 商业化设计（免费 / Pro / 企业）
* 扩展规划与营销策略


# lockScreen
