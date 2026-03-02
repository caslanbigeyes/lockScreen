# 🚀 FocusGuard 打包快速参考

## 一键打包

```bash
# 1. 检查配置
npm run test:build

# 2. 打包（选择一个）
npm run build:mac    # macOS 版本
npm run build:win    # Windows 版本  
npm run build:all    # 所有平台
```

## 输出文件

### macOS
```
dist/
├── FocusGuard-0.1.0.dmg           # 通用 DMG
├── FocusGuard-0.1.0-arm64.dmg     # Apple Silicon
├── FocusGuard-0.1.0-x64.dmg       # Intel Mac
└── FocusGuard-0.1.0-mac.zip       # ZIP 压缩包
```

### Windows
```
dist/
├── FocusGuard Setup 0.1.0.exe     # 安装程序
└── FocusGuard 0.1.0.exe           # 便携版
```

## 常用命令

```bash
# 开发
npm start                    # 启动应用
npm run test:build          # 检查打包配置

# 打包
npm run build:mac           # 打包 macOS
npm run build:win           # 打包 Windows
npm run dist                # 打包所有平台

# 许可证
npm run gen                 # 生成许可证密钥

# 清理
rm -rf dist                 # 删除打包输出
rm -rf node_modules         # 删除依赖（重装用）
```

## 文件大小

- macOS DMG: ~150-200 MB
- Windows 安装包: ~120-150 MB
- 这是正常的（包含 Chromium + Node.js）

## 分发流程

### 1. 打包
```bash
npm run build:all
```

### 2. 压缩
```bash
zip -r FocusGuard-macOS.zip dist/*.dmg
zip -r FocusGuard-Windows.zip dist/*.exe
```

### 3. 上传
- 百度网盘 / 阿里云盘
- GitHub Releases
- 自建服务器

### 4. 发送给买家
```
下载链接：https://...
许可证密钥：XXXX-XXXX-XXXX-XXXX
安装说明：见附件
```

## 版本更新

```bash
# 更新版本号
npm version patch    # 0.1.0 → 0.1.1
npm version minor    # 0.1.0 → 0.2.0
npm version major    # 0.1.0 → 1.0.0

# 重新打包
npm run build:all
```

## 故障排除

### 打包失败
```bash
rm -rf node_modules dist
npm install
npm run build:mac
```

### 缺少图标
- 暂时使用默认图标（不影响功能）
- 或准备 `build/icon.icns` 和 `build/icon.ico`

### 权限问题
```bash
sudo chown -R $(whoami) node_modules
npm run build:mac
```

## 图标（可选）

### 在线转换
- PNG → ICNS: https://cloudconvert.com/png-to-icns
- PNG → ICO: https://cloudconvert.com/png-to-ico

### 放置位置
- macOS: `build/icon.icns`
- Windows: `build/icon.ico`

## 平台要求

### 打包 macOS 版本
- 需要在 macOS 上运行
- 支持 Intel 和 Apple Silicon

### 打包 Windows 版本
- 可以在任何平台上运行
- 支持 32 位和 64 位

## 测试清单

- [ ] 运行 `npm run test:build` 检查配置
- [ ] 运行 `npm run build:mac` 或 `build:win`
- [ ] 在 `dist/` 目录找到打包文件
- [ ] 安装并测试应用
- [ ] 测试许可证激活
- [ ] 测试所有功能
- [ ] 准备分发

## 相关文档

- `BUILD_NOW.md` - 详细打包指南
- `BUILD_GUIDE.md` - 完整配置说明
- `build/ICON_README.md` - 图标制作指南
- `XIANYU_QUICK_START.md` - 闲鱼销售指南

## 需要帮助？

1. 查看 `BUILD_NOW.md` 了解详细步骤
2. 运行 `npm run test:build` 检查配置
3. 查看终端错误信息

---

**当前版本：** 0.1.0

**打包工具：** electron-builder

**支持平台：** macOS, Windows
