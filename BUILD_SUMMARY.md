# ✅ FocusGuard 打包配置完成

## 已完成的配置

### 1. ✅ 安装打包工具
- electron-builder v24.13.3 已安装
- 支持 macOS 和 Windows 打包

### 2. ✅ 配置 package.json
- 添加打包脚本（build, build:mac, build:win, build:all）
- 配置应用信息（appId, productName, description）
- 配置 macOS 打包选项（DMG, ZIP, 多架构）
- 配置 Windows 打包选项（NSIS, Portable）
- 配置文件过滤（排除测试文件、文档等）

### 3. ✅ 创建 build 目录
- `build/entitlements.mac.plist` - macOS 权限配置
- `build/ICON_README.md` - 图标制作指南

### 4. ✅ 创建文档
- `BUILD_NOW.md` - 快速开始指南
- `BUILD_GUIDE.md` - 详细配置说明
- `QUICK_BUILD_REFERENCE.md` - 快速参考
- `BUILD_SUMMARY.md` - 本文件

### 5. ✅ 创建测试脚本
- `test-build-config.js` - 配置检查工具
- `npm run test:build` - 快速检查命令

## 立即开始打包

### 方式 1：快速打包（推荐）

```bash
# 在 macOS 上
npm run build:mac

# 在 Windows 上
npm run build:win

# 同时打包两个平台（仅 macOS）
npm run build:all
```

### 方式 2：分步打包

```bash
# 1. 检查配置
npm run test:build

# 2. 开始打包
npm run build:mac    # 或 build:win

# 3. 查看结果
ls -lh dist/
```

## 打包输出

### macOS（在 dist/ 目录）
- `FocusGuard-0.1.0.dmg` - 通用 DMG 安装包
- `FocusGuard-0.1.0-arm64.dmg` - Apple Silicon 版本
- `FocusGuard-0.1.0-x64.dmg` - Intel Mac 版本
- `FocusGuard-0.1.0-mac.zip` - ZIP 压缩包

### Windows（在 dist/ 目录）
- `FocusGuard Setup 0.1.0.exe` - NSIS 安装程序
- `FocusGuard 0.1.0.exe` - 便携版（无需安装）

## 测试打包的应用

### macOS
1. 打开 `dist/` 文件夹
2. 双击 `FocusGuard-0.1.0.dmg`
3. 拖拽到 Applications 文件夹
4. 启动应用并测试

### Windows
1. 打开 `dist/` 文件夹
2. 双击 `FocusGuard Setup 0.1.0.exe`
3. 按照安装向导完成安装
4. 启动应用并测试

## 图标说明

### 当前状态
- ⚠️ 未提供自定义图标
- 将使用 Electron 默认图标
- 不影响功能，只是外观

### 添加自定义图标（可选）

1. **准备图标文件**
   - 512x512 或 1024x1024 的 PNG 图片

2. **在线转换**
   - PNG → ICNS: https://cloudconvert.com/png-to-icns
   - PNG → ICO: https://cloudconvert.com/png-to-ico

3. **放置文件**
   - macOS: `build/icon.icns`
   - Windows: `build/icon.ico`

4. **重新打包**
   ```bash
   npm run build:all
   ```

查看 `build/ICON_README.md` 了解详细说明。

## 分发给用户

### 1. 压缩文件

```bash
# macOS
zip -r FocusGuard-macOS.zip dist/*.dmg

# Windows
zip -r FocusGuard-Windows.zip dist/*.exe
```

### 2. 上传到云盘

推荐：
- 百度网盘
- 阿里云盘
- 腾讯微云
- Google Drive

### 3. 发送给买家

```
FocusGuard Pro 下载和激活

【下载链接】
百度网盘：https://pan.baidu.com/s/xxxxx
提取码：xxxx

【系统要求】
Windows: Windows 10/11 (64位)
macOS: macOS 10.15+ (Intel 或 Apple Silicon)

【安装说明】
Windows: 运行 FocusGuard Setup 0.1.0.exe
macOS: 打开 FocusGuard-0.1.0.dmg，拖拽到 Applications

【许可证密钥】
XXXX-XXXX-XXXX-XXXX

【激活步骤】
1. 打开应用，进入"设置" Tab
2. 在"许可证激活"区域输入上方密钥
3. 点击"激活"按钮
4. 看到"激活成功"提示即可使用

【功能说明】
✅ 强制锁屏 - 到点自动锁屏
✅ 数学题门禁 - 解锁需答题
✅ 随机拍照 - 防止假专注
✅ 智能分析 - 拖延指数和行为模式
✅ 详细统计 - 专注数据图表
✅ PDF 报告 - 导出周报

如有问题请随时联系我！😊
```

## 版本更新流程

### 1. 修改代码
- 修复 Bug
- 添加新功能
- 优化性能

### 2. 更新版本号

```bash
# 小更新（Bug 修复）
npm version patch    # 0.1.0 → 0.1.1

# 中更新（新功能）
npm version minor    # 0.1.0 → 0.2.0

# 大更新（重大变更）
npm version major    # 0.1.0 → 1.0.0
```

### 3. 重新打包

```bash
npm run build:all
```

### 4. 通知用户
- 更新闲鱼商品描述
- 通知已购买用户可免费更新
- 提供新版本下载链接

## 常见问题

### Q: 打包需要多长时间？

A: 3-5 分钟，取决于电脑性能。首次打包可能需要下载依赖，会更久一些。

### Q: 打包后的文件为什么这么大？

A: Electron 应用包含完整的 Chromium 和 Node.js，所以通常在 100-200 MB。这是正常的。

### Q: 可以在 Windows 上打包 macOS 版本吗？

A: 不推荐。建议在 macOS 上打包 macOS 版本，在 Windows 上打包 Windows 版本。

### Q: 打包失败怎么办？

A: 
```bash
# 清理并重试
rm -rf node_modules dist
npm install
npm run build:mac
```

### Q: 用户安装时提示安全警告？

A: 这是因为应用未签名。解决方法：
- macOS: 右键点击 → 打开 → 打开
- Windows: 点击"更多信息" → "仍要运行"

如需避免警告，需要购买代码签名证书（macOS: $99/年，Windows: ~$200/年）。

## 下一步

### 1. 测试打包

```bash
npm run test:build
npm run build:mac
```

### 2. 测试应用
- 安装打包的应用
- 测试所有功能
- 测试许可证激活

### 3. 准备分发
- 上传到云盘
- 准备下载链接
- 准备安装说明

### 4. 开始销售
- 在闲鱼发布商品
- 设置自动发货
- 等待订单

## 相关文档

- `BUILD_NOW.md` - 立即开始打包
- `BUILD_GUIDE.md` - 详细配置说明
- `QUICK_BUILD_REFERENCE.md` - 快速参考
- `XIANYU_QUICK_START.md` - 闲鱼销售指南
- `build/ICON_README.md` - 图标制作指南

## 命令速查

```bash
# 检查配置
npm run test:build

# 打包
npm run build:mac      # macOS
npm run build:win      # Windows
npm run build:all      # 所有平台

# 生成许可证
npm run gen

# 测试应用
npm start

# 清理
rm -rf dist
```

---

**配置完成时间：** 2026-02-28

**打包工具：** electron-builder v24.13.3

**支持平台：** macOS (x64, arm64), Windows (x64, ia32)

**状态：** ✅ 可以开始打包了！

**下一步：** 运行 `npm run build:mac` 或 `npm run build:win`
