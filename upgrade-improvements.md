# FocusGuard Pro 升级流程完善建议

## 当前状态分析

### ✅ 已实现
1. 试用期管理（7天倒计时）
2. 许可证激活/停用功能
3. LemonSqueezy API 集成（activate/validate/deactivate）
4. Pro 功能锁定检测
5. 许可证状态 UI 显示

### ❌ 缺失的关键功能

## 1. 购买流程入口（最重要）

**问题：** 用户点击"升级 Pro"或"获取 FocusGuard Pro"按钮后，没有实际的购买页面链接。

**需要添加：**
- LemonSqueezy 产品购买链接
- 在 `proGetBtn` 和 `bannerAction` 点击时打开购买页面

```javascript
// 需要在 license.js 或环境变量中配置
const PURCHASE_URL = "https://your-store.lemonsqueezy.com/checkout/buy/product-id";

// 在 renderer.js 中修改
proGetBtn.addEventListener("click", () => {
  window.app.openExternal(PURCHASE_URL);
  proModal.classList.remove("visible");
});

bannerAction.addEventListener("click", () => {
  if (bannerAction.textContent === "升级 Pro") {
    window.app.openExternal(PURCHASE_URL);
  } else {
    const settingsTab = document.querySelector('[data-tab="settings"]');
    settingsTab.click();
  }
});
```

## 2. 购买后的激活流程说明

**问题：** 用户购买后不知道如何获取和使用许可证密钥。

**需要添加：**
- 购买成功后的邮件说明
- 应用内的激活指引
- 许可证输入框的占位符提示

```html
<!-- 改进许可证输入区域 -->
<div class="license-help-text">
  购买后，您将收到包含许可证密钥的邮件。请在下方输入密钥激活 Pro 功能。
</div>
<div class="license-row">
  <input id="licenseInput" placeholder="例如：XXXX-XXXX-XXXX-XXXX" />
  <button class="btn btn-primary" id="activateLicenseBtn">激活</button>
</div>
<div class="license-help-link">
  <a href="#" id="purchaseLink">还没有许可证？立即购买</a>
</div>
```

## 3. 试用期到期提醒

**问题：** 试用期即将到期时，没有主动提醒用户。

**需要添加：**
- 试用期剩余 3 天、1 天时的弹窗提醒
- 到期当天的特别提示

```javascript
// 在 license.js 中添加
const shouldShowTrialReminder = () => {
  const daysLeft = getTrialDaysLeft();
  const lastReminder = licenseData.lastTrialReminder || 0;
  const now = Date.now();
  
  // 每天最多提醒一次
  if (now - lastReminder < 24 * 60 * 60 * 1000) return false;
  
  // 剩余 3 天、1 天时提醒
  return daysLeft === 3 || daysLeft === 1;
};

// 在 main.js 中添加提醒窗口
const showTrialReminder = (daysLeft) => {
  if (mainWindow) {
    mainWindow.webContents.send("show-trial-reminder", { daysLeft });
  }
};
```

## 4. 离线激活支持

**问题：** 当前激活必须联网，但用户可能在离线环境下购买。

**建议：**
- 保持当前在线激活为主要方式
- 添加离线激活说明（联系客服）
- 改进错误提示，区分网络错误和密钥错误

```javascript
// 改进 activate 函数的错误处理
const activate = async (licenseKey) => {
  if (!licenseKey || !licenseKey.trim()) {
    return { success: false, error: "请输入许可证密钥" };
  }
  try {
    const result = await lemonRequest("activate", {
      license_key: licenseKey.trim(),
      instance_name: `FocusGuard-${require("os").hostname()}`,
    });

    if (result.activated || result.license_key) {
      // ... 激活成功逻辑
      return { success: true };
    }

    // 改进错误消息
    let errorMsg = result.error || result.message || "激活失败";
    if (errorMsg.includes("already activated")) {
      errorMsg = "此密钥已在其他设备激活，请先停用或联系客服";
    } else if (errorMsg.includes("invalid")) {
      errorMsg = "密钥无效，请检查输入是否正确";
    }
    
    return { success: false, error: errorMsg };
  } catch (err) {
    return { 
      success: false, 
      error: `网络连接失败，请检查网络后重试。如持续失败，请联系客服进行离线激活。` 
    };
  }
};
```

## 5. 价格和功能对比展示

**问题：** 用户不清楚 Pro 版本的价值和价格。

**需要添加：**
- Pro 功能列表页面
- 价格信息
- 免费版 vs Pro 版对比

```html
<!-- 新增功能对比页面 pricing.html -->
<div class="pricing-container">
  <div class="pricing-header">
    <h1>升级到 FocusGuard Pro</h1>
    <p>解锁全部高级功能，提升专注效率</p>
  </div>
  
  <div class="pricing-comparison">
    <div class="plan free">
      <h3>免费版</h3>
      <ul>
        <li>✓ 基础专注计时</li>
        <li>✓ 强制锁屏</li>
        <li>✓ 7天试用期</li>
        <li>✗ 随机拍照监督</li>
        <li>✗ 解锁答题挑战</li>
        <li>✗ 自适应难度</li>
        <li>✗ 详细统计图表</li>
        <li>✗ PDF 周报导出</li>
      </ul>
    </div>
    
    <div class="plan pro">
      <h3>Pro 版</h3>
      <div class="price">¥99 <span>/永久</span></div>
      <ul>
        <li>✓ 所有免费功能</li>
        <li>✓ 随机拍照监督</li>
        <li>✓ 解锁答题挑战</li>
        <li>✓ 自适应难度系统</li>
        <li>✓ 详细统计图表</li>
        <li>✓ PDF 周报导出</li>
        <li>✓ 行为模式分析</li>
        <li>✓ 终身更新</li>
      </ul>
      <button class="btn-buy">立即购买</button>
    </div>
  </div>
</div>
```

## 6. 环境变量配置

**问题：** LemonSqueezy 配置硬编码在代码中。

**需要添加：**
- .env 文件支持
- 配置文档

```bash
# .env.example
LEMONSQUEEZY_STORE_ID=your_store_id
LEMONSQUEEZY_PRODUCT_ID=your_product_id
PURCHASE_URL=https://your-store.lemonsqueezy.com/checkout/buy/product-id
```

```javascript
// 在 main.js 开头添加
require('dotenv').config();

// 在 license.js 中使用
const STORE_ID = process.env.LEMONSQUEEZY_STORE_ID || "";
const PURCHASE_URL = process.env.PURCHASE_URL || "";
```

## 7. 激活成功后的体验优化

**问题：** 激活成功后，用户不知道发生了什么变化。

**需要添加：**
- 激活成功的欢迎弹窗
- Pro 功能解锁动画
- 功能引导

```javascript
// 在 renderer.js 中添加
const showWelcomeToPro = () => {
  const modal = document.createElement('div');
  modal.className = 'welcome-pro-modal';
  modal.innerHTML = `
    <div class="welcome-content">
      <div class="welcome-icon">🎉</div>
      <h2>欢迎使用 FocusGuard Pro！</h2>
      <p>您已成功激活 Pro 版本，现在可以使用：</p>
      <ul>
        <li>随机拍照监督</li>
        <li>解锁答题挑战</li>
        <li>自适应难度系统</li>
        <li>详细统计图表</li>
        <li>PDF 周报导出</li>
      </ul>
      <button class="btn btn-primary" onclick="this.closest('.welcome-pro-modal').remove()">
        开始使用
      </button>
    </div>
  `;
  document.body.appendChild(modal);
};

// 在激活成功后调用
if (result.success) {
  licenseFeedback.textContent = "激活成功！";
  licenseFeedback.className = "license-feedback success";
  setTimeout(() => showWelcomeToPro(), 500);
}
```

## 8. 许可证管理功能

**问题：** 用户无法查看许可证详情和管理设备。

**需要添加：**
- 许可证信息展示（到期时间、设备数等）
- 设备管理（如果支持多设备）
- 许可证转移说明

```javascript
// 在 license.js 中添加
const getLicenseInfo = async () => {
  if (!licenseData || !licenseData.key) return null;
  
  try {
    const result = await lemonRequest("validate", {
      license_key: licenseData.key,
      instance_id: licenseData.instanceId,
    });
    
    return {
      key: licenseData.key,
      status: result.valid ? "active" : "invalid",
      activatedAt: licenseData.lastValidatedAt,
      instanceName: result.instance?.name || "当前设备",
      // 如果 LemonSqueezy 返回更多信息
      expiresAt: result.license?.expires_at,
      activationLimit: result.license?.activation_limit,
      activationUsage: result.license?.activation_usage,
    };
  } catch {
    return null;
  }
};
```

## 实施优先级

### 🔴 高优先级（必须实现）
1. **购买流程入口** - 没有这个用户无法购买
2. **购买后激活说明** - 用户不知道如何使用购买的密钥
3. **环境变量配置** - 便于部署和测试

### 🟡 中优先级（建议实现）
4. **试用期到期提醒** - 提高转化率
5. **价格和功能对比** - 帮助用户决策
6. **激活成功体验优化** - 提升用户满意度

### 🟢 低优先级（可选）
7. **离线激活支持** - 特殊场景需求
8. **许可证管理功能** - 高级用户需求

## 测试清单

- [ ] 试用期第 1 天：显示"试用期：剩余 7 天"
- [ ] 试用期第 7 天：显示"试用期：剩余 1 天"
- [ ] 试用期第 8 天：显示"试用已到期"，Pro 功能被锁定
- [ ] 点击"升级 Pro"按钮：打开购买页面
- [ ] 输入有效密钥：激活成功，Pro 功能解锁
- [ ] 输入无效密钥：显示错误提示
- [ ] 网络断开时激活：显示网络错误提示
- [ ] 激活后重启应用：Pro 状态保持
- [ ] 停用许可证：恢复到试用/过期状态
- [ ] 点击 Pro 功能（未激活）：显示锁定弹窗
