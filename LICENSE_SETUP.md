# FocusGuard 许可证系统配置指南

## 快速开始

### 1. 配置 LemonSqueezy

1. 在 [LemonSqueezy](https://lemonsqueezy.com) 创建账号和商店
2. 创建产品（Product）和变体（Variant）
3. 获取以下信息：
   - Store ID
   - Product Variant ID（用于购买链接）

### 2. 配置环境变量

复制 `.env.example` 为 `.env`：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的配置：

```env
LEMONSQUEEZY_STORE_ID=12345
PURCHASE_URL=https://your-store.lemonsqueezy.com/checkout/buy/abc123def456
```

### 3. 测试试用期功能

#### 测试场景 1：新用户（试用期 7 天）

1. 删除用户数据目录中的 `license.json`：
   - macOS: `~/Library/Application Support/lockscreen-focus/license.json`
   - Windows: `%APPDATA%/lockscreen-focus/license.json`
   - Linux: `~/.config/lockscreen-focus/license.json`

2. 启动应用：
   ```bash
   npm start
   ```

3. 应该看到：
   - 顶部横幅显示："试用期：剩余 7 天"
   - 横幅颜色为蓝色（trial）
   - "升级 Pro" 按钮可见

#### 测试场景 2：试用期即将到期

手动编辑 `license.json`，修改 `firstLaunchAt` 为 6 天前：

```json
{
  "firstLaunchAt": 1234567890000,  // 改为 6 天前的时间戳
  "status": "trial",
  "key": "",
  "instanceId": "",
  "lastValidatedAt": 0,
  "lastValidationResult": null
}
```

计算时间戳：
```javascript
// 6 天前
Date.now() - (6 * 24 * 60 * 60 * 1000)
```

重启应用，应该看到："试用期：剩余 1 天"

#### 测试场景 3：试用期已过期

修改 `firstLaunchAt` 为 8 天前：

```json
{
  "firstLaunchAt": 1234567890000,  // 改为 8 天前的时间戳
  "status": "trial",
  ...
}
```

重启应用，应该看到：
- 顶部横幅显示："试用已到期，升级 Pro 解锁全部功能"
- 横幅颜色为红色（expired）
- Pro 功能被锁定（随机拍照、解锁答题等）

### 4. 测试购买流程

#### 步骤 1：点击购买按钮

测试以下入口是否都能打开购买页面：

1. 顶部横幅的"升级 Pro"按钮
2. Pro 功能锁定弹窗的"获取 FocusGuard Pro"按钮
3. 设置页面许可证区域的"还没有许可证？立即购买"链接

#### 步骤 2：模拟购买成功

在 LemonSqueezy 后台创建测试订单，获取测试许可证密钥。

或者使用 LemonSqueezy 的测试模式：
- 测试卡号：`4242 4242 4242 4242`
- 任意未来日期和 CVC

#### 步骤 3：激活许可证

1. 在设置页面的许可证区域输入密钥
2. 点击"激活"按钮
3. 应该看到：
   - "激活成功！"提示
   - 顶部横幅变为绿色，显示"Pro 已激活"
   - Pro 功能解锁（随机拍照、解锁答题等选项可用）

### 5. 测试许可证验证

#### 在线验证

1. 激活许可证后，关闭应用
2. 重新启动应用
3. 应该自动验证许可证并保持 Pro 状态

#### 离线容忍（7 天缓存）

1. 激活许可证
2. 断开网络
3. 重启应用
4. 应该仍然显示 Pro 状态（使用缓存）

#### 缓存过期测试

手动编辑 `license.json`，修改 `lastValidatedAt` 为 8 天前：

```json
{
  "status": "active",
  "key": "your-license-key",
  "lastValidatedAt": 1234567890000,  // 8 天前
  "lastValidationResult": true,
  ...
}
```

重启应用（断网状态），应该降级为 expired 状态。

### 6. 测试停用功能

1. 在已激活状态下，点击"停用"按钮
2. 应该看到：
   - "已停用"提示
   - 如果仍在试用期内，恢复为 trial 状态
   - 如果试用期已过，变为 expired 状态
   - Pro 功能被锁定

### 7. 测试错误处理

#### 无效密钥

输入随机字符串，点击激活，应该看到：
"密钥无效，请检查输入是否正确（注意大小写和连字符）"

#### 网络错误

1. 断开网络
2. 尝试激活新密钥
3. 应该看到：
"网络连接失败：...。请检查网络后重试，如持续失败请联系客服。"

#### 密钥已在其他设备激活

使用已激活的密钥在另一台设备激活，应该看到：
"此密钥已在其他设备激活。如需转移，请先在原设备停用，或联系客服协助。"

## 常见问题

### Q: 如何重置试用期？

A: 删除用户数据目录中的 `license.json` 文件。

### Q: 如何测试不同的试用期时长？

A: 修改 `license.js` 中的 `TRIAL_DAYS` 常量：

```javascript
const TRIAL_DAYS = 1; // 改为 1 天用于快速测试
```

### Q: 如何查看许可证文件位置？

A: 在应用中打开开发者工具（macOS: Cmd+Option+I），运行：

```javascript
require('electron').remote.app.getPath('userData')
```

### Q: 购买链接不工作怎么办？

A: 检查以下几点：
1. `.env` 文件是否正确配置
2. `PURCHASE_URL` 是否是完整的 URL
3. 在浏览器中手动访问该 URL 是否能打开购买页面

## 生产环境部署

### 1. 设置环境变量

不要将 `.env` 文件提交到版本控制。在生产环境中通过以下方式设置：

#### macOS/Linux
```bash
export LEMONSQUEEZY_STORE_ID=your_store_id
export PURCHASE_URL=https://your-store.lemonsqueezy.com/checkout/buy/variant-id
```

#### Windows
```cmd
set LEMONSQUEEZY_STORE_ID=your_store_id
set PURCHASE_URL=https://your-store.lemonsqueezy.com/checkout/buy/variant-id
```

### 2. 打包应用

```bash
# 安装打包工具
npm install --save-dev electron-builder

# 打包
npm run build
```

### 3. 配置 LemonSqueezy Webhook（可选）

如果需要自动处理退款、订阅取消等事件，可以配置 Webhook：

1. 在 LemonSqueezy 后台设置 Webhook URL
2. 创建后端服务接收 Webhook 事件
3. 根据事件类型更新许可证状态

## 技术细节

### 许可证状态流转

```
新用户 → trial (7天)
  ↓
试用期到期 → expired
  ↓
购买并激活 → active
  ↓
停用 → trial (如果仍在7天内) 或 expired
```

### 验证逻辑

```javascript
isPro() {
  if (status === "active" && 缓存有效) return true;
  if (status === "trial" && 试用期有效) return true;
  return false;
}
```

### 缓存机制

- 激活后，许可证验证结果缓存 7 天
- 每 6 小时自动在线验证一次
- 离线时使用缓存，缓存过期后降级

## 支持

如有问题，请查看：
- [LemonSqueezy 文档](https://docs.lemonsqueezy.com)
- [Electron 文档](https://www.electronjs.org/docs)
