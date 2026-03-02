# 🚀 立即打包 FocusGuard

## 快速开始（5 分钟）

### 步骤 1：安装打包工具

```bash
npm install
```

这会安装 `electron-builder`（打包工具）。

### 步骤 2：选择打包平台

**在 macOS 上：**
```bash
# 只打包 macOS 版本
npm run build:mac

# 同时打包 macOS 和 Windows 版本
npm run build:all
```

**在 Windows 上：**
```bash
# 只打包 Windows 版本
npm run build:win
```

### 步骤 3：等待打包完成

打包需要 3-5 分钟，取决于你的电脑性能。

你会看到类似的输出：
```
• electron-builder  version=24.13.3
• loaded configuration  file=package.json
• building        target=macOS zip, macOS dmg arch=x64, arm64
• packaging       platform=darwin arch=x64
• building        target=DMG
• building block map  blockMapFile=dist/FocusGuard-0.1.0.dmg.blockmap
```

### 步骤 4：查看打包结果

打包完成后，文件在 `dist/` 目录：

```bash
ls -lh dist/
```

**macOS 输出：**
- `FocusGuard-0.1.0.dmg` - DMG 安装包
- `FocusGuard-0.1.0-mac.zip` - ZIP 压缩包
- `FocusGuard-0.1.0-arm64.dmg` - Apple Silicon 版本
- `FocusGuard-0.1.0-x64.dmg` - Intel 版本

**Windows 输出：**
- `FocusGuard Setup 0.1.0.exe` - 安装程序
- `FocusGuard 0.1.0.exe` - 便携版

## 测试打包的应用

### macOS

1. 打开 `dist/` 文件夹
2. 双击 `FocusGuard-0.1.0.dmg`
3. 拖拽到 Applications 文件夹
4. 从 Launchpad 或 Applications 启动

### Windows

1. 打开 `dist/` 文件夹
2. 双击 `FocusGuard Setup 0.1.0.exe`
3. 按照安装向导完成安装
4. 从开始菜单或桌面快捷方式启动

## 常见问题

### Q: 提示找不到 electron-builder

**解决：**
```bash
npm install electron-builder --save-dev
```

### Q: 打包失败，提示权限错误

**解决：**
```bash
# 清理并重新安装
rm -rf node_modules dist
npm install
npm run build:mac
```

### Q: macOS 提示"无法打开，因为无法验证开发者"

**原因：** 应用未签名

**解决：**
1. 右键点击应用
2. 选择"打开"
3. 点击"打开"按钮
4. 或在"系统偏好设置 → 安全性与隐私"中允许

### Q: Windows 提示"Windows 已保护你的电脑"

**原因：** 应用未签名

**解决：**
1. 点击"更多信息"
2. 点击"仍要运行"

### Q: 打包后的文件很大（150MB+）

**原因：** Electron 包含完整的 Chromium 和 Node.js

**说明：** 这是正常的，所有 Electron 应用都这样

## 图标问题

### 当前状态

如果你还没有准备图标，打包会使用 Electron 默认图标。

### 添加自定义图标

1. **准备图标文件**
   - macOS: `build/icon.icns` (512x512 或 1024x1024)
   - Windows: `build/icon.ico` (256x256)

2. **在线转换工具**
   - PNG 转 ICNS: https://cloudconvert.com/png-to-icns
   - PNG 转 ICO: https://cloudconvert.com/png-to-ico

3. **重新打包**
   ```bash
   npm run build:mac
   # 或
   npm run build:win
   ```

查看 `build/ICON_README.md` 了解详细说明。

## 临时跳过图标

如果暂时不需要自定义图标，可以删除 `package.json` 中的 icon 配置：

```json
// 删除这两行
"icon": "build/icon.icns",  // macOS
"icon": "build/icon.ico"     // Windows
```

## 分发给用户

### 方式 1：云存储

1. **压缩文件**
   ```bash
   # macOS
   zip -r FocusGuard-macOS.zip dist/*.dmg
   
   # Windows
   zip -r FocusGuard-Windows.zip dist/*.exe
   ```

2. **上传到云盘**
   - 百度网盘
   - 阿里云盘
   - 腾讯微云
   - Google Drive

3. **分享链接**
   - 复制分享链接
   - 发送给买家

### 方式 2：直接发送

如果文件不太大，可以通过：
- 微信文件传输
- QQ 文件传输
- 邮件附件

### 方式 3：GitHub Releases

1. 创建 GitHub 仓库（可以是私有的）
2. 创建 Release
3. 上传打包文件
4. 分享 Release 链接

## 闲鱼销售流程

### 1. 打包应用

```bash
npm run build:all
```

### 2. 上传到云盘

- 创建文件夹：`FocusGuard v0.1.0`
- 上传 macOS 和 Windows 版本
- 添加安装说明文档

### 3. 收到订单后

发送给买家：
```
感谢购买 FocusGuard Pro！

【下载链接】
百度网盘：https://pan.baidu.com/s/xxxxx
提取码：xxxx

【安装说明】
Windows: 运行 FocusGuard Setup 0.1.0.exe
macOS: 打开 FocusGuard-0.1.0.dmg，拖拽到 Applications

【许可证密钥】
XXXX-XXXX-XXXX-XXXX

【激活步骤】
1. 打开应用，进入"设置" Tab
2. 输入上方密钥
3. 点击"激活"
4. 完成！

如有问题请随时联系我 😊
```

## 更新版本

### 1. 修改版本号

编辑 `package.json`：
```json
{
  "version": "0.2.0"
}
```

或使用命令：
```bash
npm version patch  # 0.1.0 → 0.1.1
npm version minor  # 0.1.0 → 0.2.0
npm version major  # 0.1.0 → 1.0.0
```

### 2. 重新打包

```bash
npm run build:all
```

### 3. 通知用户

- 在闲鱼商品描述中更新版本号
- 通知已购买的用户可以免费更新
- 提供新版本下载链接

## 打包命令速查

```bash
# 安装依赖
npm install

# 打包 macOS
npm run build:mac

# 打包 Windows
npm run build:win

# 打包所有平台
npm run build:all
npm run dist

# 清理输出
rm -rf dist

# 查看打包结果
ls -lh dist/
```

## 下一步

1. ✅ 运行 `npm install`
2. ✅ 运行 `npm run build:mac` 或 `npm run build:win`
3. ✅ 测试打包的应用
4. ✅ 上传到云盘
5. ✅ 开始销售！

---

**需要帮助？** 查看 `BUILD_GUIDE.md` 了解详细说明

**准备图标？** 查看 `build/ICON_README.md`

**开始销售？** 查看 `XIANYU_QUICK_START.md`
