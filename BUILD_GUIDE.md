# FocusGuard 打包指南

## 准备工作

### 1. 安装依赖

```bash
npm install
```

这会安装 `electron` 和 `electron-builder`。

### 2. 准备图标（可选）

将图标文件放到 `build` 目录：
- macOS: `build/icon.icns`
- Windows: `build/icon.ico`

如果没有图标，可以暂时删除 `package.json` 中的 icon 配置，使用默认图标。

查看 `build/ICON_README.md` 了解如何创建图标。

### 3. 更新应用信息

编辑 `package.json`，修改以下字段：
- `author` - 你的名字或公司名
- `description` - 应用描述
- `version` - 版本号（如 1.0.0）

## 打包命令

### 打包 macOS 版本

```bash
npm run build:mac
```

输出文件：
- `dist/FocusGuard-0.1.0.dmg` - DMG 安装包
- `dist/FocusGuard-0.1.0-mac.zip` - ZIP 压缩包
- `dist/FocusGuard-0.1.0-arm64.dmg` - Apple Silicon 版本
- `dist/FocusGuard-0.1.0-x64.dmg` - Intel 版本

### 打包 Windows 版本

```bash
npm run build:win
```

输出文件：
- `dist/FocusGuard Setup 0.1.0.exe` - NSIS 安装程序
- `dist/FocusGuard 0.1.0.exe` - 便携版（无需安装）

### 同时打包两个平台

```bash
npm run build:all
# 或
npm run dist
```

## 打包配置说明

### 包含的文件

打包会包含：
- 所有 `.js` 文件（主程序）
- 所有 `.html` 文件（界面）
- 所有 `.css` 文件（样式）
- `node_modules/electron`（运行时）

### 排除的文件

打包会排除：
- 所有 `.md` 文档
- `test-*.js` 测试文件
- `generate-license*.js` 密钥生成工具
- `licenses*.txt` 密钥文件
- `purchase-page/` 购买页面（开发用）
- 大部分 `node_modules`（只保留必需的）

## 平台特定说明

### macOS

**支持的架构：**
- x64 (Intel Mac)
- arm64 (Apple Silicon / M1/M2/M3)

**输出格式：**
- DMG - 标准 macOS 安装包，拖拽安装
- ZIP - 压缩包，解压即用

**注意事项：**
- 需要在 macOS 上打包
- 首次运行可能需要在"系统偏好设置 → 安全性与隐私"中允许
- 如需发布到 App Store，需要 Apple Developer 账号和代码签名

### Windows

**支持的架构：**
- x64 (64位)
- ia32 (32位)

**输出格式：**
- NSIS - 标准 Windows 安装程序，支持自定义安装路径
- Portable - 便携版，无需安装，解压即用

**注意事项：**
- 可以在 macOS、Windows 或 Linux 上打包 Windows 版本
- 首次运行可能触发 Windows Defender 警告（未签名应用）
- 如需避免警告，需要购买代码签名证书

## 跨平台打包

### 在 macOS 上打包 Windows 版本

```bash
npm run build:win
```

electron-builder 支持在 macOS 上打包 Windows 应用。

### 在 Windows 上打包 macOS 版本

需要额外配置，不推荐。建议：
- 在 macOS 上打包 macOS 版本
- 在 Windows 上打包 Windows 版本
- 或使用 CI/CD（如 GitHub Actions）自动打包

## 文件大小优化

### 当前大小（预估）

- macOS DMG: ~150-200 MB
- Windows 安装包: ~120-150 MB

### 优化建议

1. **移除未使用的依赖**
   ```bash
   npm prune --production
   ```

2. **压缩代码**（可选）
   - 使用 webpack 或其他打包工具
   - 压缩 JavaScript 代码

3. **优化图片**
   - 压缩 PNG/JPG 图片
   - 使用 WebP 格式

## 版本号管理

### 更新版本号

编辑 `package.json`：
```json
{
  "version": "1.0.0"
}
```

版本号格式：`主版本.次版本.修订号`
- 主版本：重大更新，不兼容的 API 变更
- 次版本：新功能，向后兼容
- 修订号：Bug 修复，向后兼容

### 自动更新版本号

```bash
# 修订号 +1 (0.1.0 → 0.1.1)
npm version patch

# 次版本 +1 (0.1.0 → 0.2.0)
npm version minor

# 主版本 +1 (0.1.0 → 1.0.0)
npm version major
```

## 发布前检查清单

- [ ] 更新版本号
- [ ] 测试所有功能
- [ ] 准备应用图标
- [ ] 更新 README.md
- [ ] 准备用户文档
- [ ] 测试打包后的应用
- [ ] 在目标平台上测试安装
- [ ] 准备发布说明（Release Notes）

## 常见问题

### Q: 打包失败，提示找不到 electron-builder

**解决：**
```bash
npm install electron-builder --save-dev
```

### Q: macOS 打包失败，提示权限问题

**解决：**
```bash
# 清理缓存
rm -rf dist
rm -rf node_modules
npm install
npm run build:mac
```

### Q: Windows 打包后无法运行

**检查：**
1. 是否在 64 位系统上运行 64 位版本
2. 是否安装了必要的运行时（通常不需要）
3. 查看错误日志

### Q: 打包后的应用很大

**原因：**
- Electron 包含完整的 Chromium 和 Node.js
- 这是正常的，大多数 Electron 应用都在 100-200 MB

**优化：**
- 移除未使用的依赖
- 使用 asar 打包（electron-builder 默认启用）

### Q: 如何添加自动更新功能

**方案：**
1. 使用 electron-updater（需要服务器）
2. 手动检查更新（调用 API）
3. 提示用户下载新版本

参考：https://www.electron.build/auto-update

## 分发方式

### 1. 直接分发

- 将打包好的文件上传到云存储
- 提供下载链接给用户
- 适合小规模分发

### 2. GitHub Releases

- 在 GitHub 仓库创建 Release
- 上传打包文件作为附件
- 用户可以直接下载

### 3. 应用商店

**macOS App Store：**
- 需要 Apple Developer 账号（$99/年）
- 需要代码签名和公证
- 审核周期：1-7 天

**Microsoft Store：**
- 需要 Microsoft 开发者账号（$19 一次性）
- 需要应用认证
- 审核周期：1-3 天

### 4. 自建下载页面

- 创建官网或落地页
- 提供下载链接和使用说明
- 可以收集用户邮箱

## 闲鱼销售建议

### 打包策略

1. **打包两个平台**
   ```bash
   npm run build:all
   ```

2. **压缩文件**
   ```bash
   # macOS
   zip -r FocusGuard-macOS.zip dist/*.dmg
   
   # Windows
   zip -r FocusGuard-Windows.zip dist/*.exe
   ```

3. **上传到云存储**
   - 百度网盘
   - 阿里云盘
   - 腾讯微云

4. **提供给买家**
   - 发送下载链接
   - 提供安装说明
   - 发送许可证密钥

### 安装说明模板

```
FocusGuard 安装指南

【Windows 用户】
1. 下载：FocusGuard Setup 0.1.0.exe
2. 双击运行安装程序
3. 按照提示完成安装
4. 首次运行可能需要允许防火墙

【macOS 用户】
1. 下载：FocusGuard-0.1.0.dmg
2. 双击打开 DMG 文件
3. 拖拽 FocusGuard 到 Applications 文件夹
4. 首次运行需要在"系统偏好设置 → 安全性与隐私"中允许

【激活许可证】
1. 打开应用，进入"设置" Tab
2. 在"许可证激活"区域输入密钥
3. 点击"激活"按钮
4. 看到"激活成功"提示即可使用

您的许可证密钥：XXXX-XXXX-XXXX-XXXX

如有问题请联系我！
```

## 下一步

1. **安装依赖**
   ```bash
   npm install
   ```

2. **测试打包**
   ```bash
   # macOS
   npm run build:mac
   
   # Windows
   npm run build:win
   ```

3. **测试安装**
   - 在目标平台上安装打包好的应用
   - 测试所有功能
   - 确认许可证激活正常

4. **准备分发**
   - 上传到云存储
   - 准备下载链接
   - 准备安装说明

---

**打包工具：** electron-builder v24.13.3

**支持平台：** macOS (x64, arm64), Windows (x64, ia32)

**输出目录：** `dist/`
