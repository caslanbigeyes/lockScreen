# 🎉 FocusGuard 打包成功！

## macOS 版本已完成

打包时间：2026-02-28 16:48

### 输出文件

```
dist/
├── FocusGuard-0.1.0.dmg                    96 MB  # Intel Mac DMG
├── FocusGuard-0.1.0-arm64.dmg              91 MB  # Apple Silicon DMG
├── FocusGuard-0.1.0-mac.zip                93 MB  # Intel Mac ZIP
└── FocusGuard-0.1.0-arm64-mac.zip          88 MB  # Apple Silicon ZIP
```

### 文件说明

**DMG 文件（推荐分发）：**
- `FocusGuard-0.1.0.dmg` - Intel Mac 用户使用
- `FocusGuard-0.1.0-arm64.dmg` - Apple Silicon (M1/M2/M3) 用户使用

**ZIP 文件（备用）：**
- `FocusGuard-0.1.0-mac.zip` - Intel Mac 压缩包
- `FocusGuard-0.1.0-arm64-mac.zip` - Apple Silicon 压缩包

### 注意事项

**代码签名：**
- ⚠️ 应用未签名（需要 Apple Developer 账号）
- 用户首次运行需要在"系统偏好设置 → 安全性与隐私"中允许
- 或右键点击应用 → 打开 → 打开

**图标：**
- ⚠️ 使用 Electron 默认图标
- 不影响功能，只是外观
- 如需自定义图标，查看 `build/ICON_README.md`

## 测试安装

### 1. 打开 DMG 文件

```bash
open dist/FocusGuard-0.1.0-arm64.dmg
# 或
open dist/FocusGuard-0.1.0.dmg
```

### 2. 拖拽到 Applications

将 FocusGuard 拖拽到 Applications 文件夹

### 3. 首次运行

1. 从 Launchpad 或 Applications 启动
2. 如果提示"无法打开"：
   - 打开"系统偏好设置"
   - 进入"安全性与隐私"
   - 点击"仍要打开"
3. 或者右键点击应用 → 打开 → 打开

### 4. 测试功能

- ✅ 应用启动正常
- ✅ 界面显示正常
- ✅ 许可证激活功能
- ✅ 专注功能
- ✅ 锁屏功能
- ✅ 数学答题功能

## 打包 Windows 版本

如果需要 Windows 版本，运行：

```bash
npm run build:win
```

输出文件：
- `FocusGuard Setup 0.1.0.exe` - 安装程序
- `FocusGuard 0.1.0.exe` - 便携版

## 分发准备

### 方式 1：云盘分发（推荐）

1. **选择要分发的文件**
   ```bash
   # 推荐只分发 DMG 文件（更小，更常用）
   cp dist/FocusGuard-0.1.0.dmg ~/Desktop/
   cp dist/FocusGuard-0.1.0-arm64.dmg ~/Desktop/
   ```

2. **压缩（可选）**
   ```bash
   cd dist
   zip FocusGuard-macOS.zip *.dmg
   ```

3. **上传到云盘**
   - 百度网盘
   - 阿里云盘
   - 腾讯微云

4. **获取分享链接**

### 方式 2：GitHub Releases

1. 创建 GitHub 仓库（可以是私有的）
2. 创建新的 Release
3. 上传 DMG 文件作为附件
4. 分享 Release 链接

### 方式 3：自建服务器

上传到自己的服务器，提供直接下载链接。

## 给买家的安装说明

```
FocusGuard Pro - macOS 安装指南

【系统要求】
macOS 10.15 或更高版本
支持 Intel Mac 和 Apple Silicon (M1/M2/M3)

【下载文件】
Intel Mac: FocusGuard-0.1.0.dmg (96 MB)
Apple Silicon: FocusGuard-0.1.0-arm64.dmg (91 MB)

不确定？查看"关于本机"：
- 如果显示 Intel，下载 Intel 版本
- 如果显示 Apple M1/M2/M3，下载 arm64 版本

【安装步骤】
1. 双击下载的 DMG 文件
2. 拖拽 FocusGuard 到 Applications 文件夹
3. 从 Launchpad 或 Applications 启动

【首次运行】
如果提示"无法打开，因为无法验证开发者"：

方法 1（推荐）：
1. 右键点击 FocusGuard
2. 选择"打开"
3. 点击"打开"按钮

方法 2：
1. 打开"系统偏好设置"
2. 进入"安全性与隐私"
3. 点击"仍要打开"

【激活许可证】
1. 打开应用，进入"设置" Tab
2. 在"许可证激活"区域输入密钥
3. 点击"激活"按钮
4. 看到"激活成功"提示即可使用

您的许可证密钥：XXXX-XXXX-XXXX-XXXX

【功能说明】
✅ 强制锁屏 - 到点自动锁屏，无法取消
✅ 数学题门禁 - 解锁需要答对数学题
✅ 随机拍照 - 防止假专注（Pro）
✅ 智能分析 - 拖延指数和行为模式（Pro）
✅ 详细统计 - 专注数据图表（Pro）
✅ PDF 报告 - 导出周报（Pro）

【常见问题】
Q: 提示"已损坏，无法打开"
A: 在终端运行：
   xattr -cr /Applications/FocusGuard.app

Q: 应用无法启动
A: 确认系统版本 >= macOS 10.15

Q: 许可证激活失败
A: 检查密钥格式是否正确（XXXX-XXXX-XXXX-XXXX）

如有其他问题请联系我！😊
```

## 闲鱼商品描述更新

```
【FocusGuard Pro - macOS 版本】

✨ 专注力提升神器，强制锁屏 + 智能监控

📦 支持系统：
• macOS 10.15 或更高版本
• Intel Mac 和 Apple Silicon (M1/M2/M3) 通用

💾 文件大小：约 90 MB

🎯 核心功能：
• 强制锁屏 - 到点自动锁屏，无法取消
• 数学题门禁 - 解锁需要答对数学题
• 随机拍照 - 防止假专注
• 智能分析 - 拖延指数和行为模式
• 详细统计 - 专注数据图表
• PDF 报告 - 导出周报

💰 价格：¥79 永久使用

📝 发货说明：
• 拍下后立即发货
• 提供下载链接和许可证密钥
• 包含详细安装说明
• 终身免费更新

⚠️ 注意事项：
• 一个密钥只能激活一台电脑
• 如需更换设备，联系我停用旧设备
• 请勿分享密钥给他人

💬 售后保障：
• 7 天无理由退款
• 终身技术支持
• 有问题随时联系

立即购买，开启高效人生！🚀
```

## 下一步

### 1. 测试应用
- [ ] 安装并启动应用
- [ ] 测试所有功能
- [ ] 测试许可证激活
- [ ] 在不同 Mac 上测试（Intel 和 Apple Silicon）

### 2. 准备分发
- [ ] 上传到云盘
- [ ] 准备下载链接
- [ ] 准备安装说明
- [ ] 生成许可证密钥

### 3. 更新商品
- [ ] 更新闲鱼商品描述
- [ ] 添加系统要求说明
- [ ] 设置自动发货

### 4. 开始销售
- [ ] 等待订单
- [ ] 发送下载链接和密钥
- [ ] 提供安装支持

## 打包 Windows 版本

如果还需要 Windows 版本：

```bash
npm run build:win
```

或同时打包两个平台：

```bash
npm run build:all
```

## 版本更新

当需要发布新版本时：

```bash
# 1. 更新版本号
npm version patch    # 0.1.0 → 0.1.1

# 2. 重新打包
npm run build:mac

# 3. 通知用户更新
```

## 相关文档

- `BUILD_NOW.md` - 打包指南
- `BUILD_GUIDE.md` - 详细配置
- `XIANYU_QUICK_START.md` - 闲鱼销售指南
- `build/ICON_README.md` - 图标制作指南

---

**打包完成时间：** 2026-02-28 16:48

**版本：** 0.1.0

**平台：** macOS (Intel + Apple Silicon)

**状态：** ✅ 可以开始分发了！

**下一步：** 测试安装，然后上传到云盘开始销售
