# 🔑 许可证密钥生成指南

## 📋 两种生成方式

### 方式 A：简化版（推荐）

**特点：**
- ✅ 直接在控制台显示，方便复制
- ✅ 保存到固定文件 `licenses.txt`
- ✅ 简洁明了

**使用方法：**

```bash
# 生成 1 个密钥
npm run gen

# 生成 5 个密钥
npm run gen 5

# 生成 10 个密钥
npm run gen 10
```

**输出示例：**
```
🔑 FocusGuard Pro 许可证密钥

══════════════════════════════════════════════════
01. EA59-4D26-058B-AA49
02. 389F-100F-E3E0-D202
03. 017F-F61B-09E5-AB34
04. DA2C-80DA-CE34-C73D
05. 6045-5F6E-4325-63AE
══════════════════════════════════════════════════

✅ 已生成 5 个密钥

💾 密钥已保存到：licenses.txt
📋 直接复制上面的密钥发送给买家即可
```

**文件位置：**
- 保存在项目根目录的 `licenses.txt`
- 每次生成会覆盖之前的内容

---

### 方式 B：完整版

**特点：**
- ✅ 包含详细信息（生成时间、使用说明等）
- ✅ 每次生成新文件（带时间戳）
- ✅ 适合长期保存记录

**使用方法：**

```bash
# 生成 1 个密钥
npm run generate:license

# 生成 10 个密钥
npm run generate:license 10
```

**文件位置：**
- 保存在项目根目录
- 文件名格式：`licenses-2026-02-28T05-46-29.txt`
- 每次生成都会创建新文件

---

## 🎯 推荐使用场景

### 日常发货：使用简化版

```bash
# 收到订单后
npm run gen

# 复制密钥
# 发送给买家
```

### 批量准备：使用完整版

```bash
# 提前生成 20 个备用密钥
npm run generate:license 20

# 保存文件，需要时查看
```

---

## 📝 完整发货流程

### 1. 收到闲鱼订单通知

### 2. 生成许可证密钥

```bash
npm run gen
```

### 3. 复制密钥

从控制台或 `licenses.txt` 文件中复制，例如：
```
EA59-4D26-058B-AA49
```

### 4. 发送给买家（通过闲鱼消息）

```
感谢购买 FocusGuard Pro！

您的许可证密钥：EA59-4D26-058B-AA49

激活步骤：
1. 打开 FocusGuard 应用
2. 进入"设置" Tab
3. 在"许可证"区域输入上方密钥
4. 点击"激活"按钮
5. 完成！

如有问题请随时联系我 😊
```

### 5. 记录密钥（可选）

创建 Excel 表格记录：

| 日期 | 订单号 | 买家 | 密钥 | 状态 |
|------|--------|------|------|------|
| 2024-01-15 | XY123456 | 张三 | EA59-4D26-058B-AA49 | 已激活 |

---

## 🔍 查找生成的文件

### 简化版文件

```bash
# 查看文件
cat licenses.txt

# 或在文件管理器中打开
# macOS
open licenses.txt

# Windows
start licenses.txt
```

### 完整版文件

```bash
# 列出所有许可证文件
ls -lh licenses-*.txt

# 查看最新的文件
ls -t licenses-*.txt | head -1 | xargs cat
```

---

## 💡 快捷命令对比

| 命令 | 说明 | 文件 | 适用场景 |
|------|------|------|---------|
| `npm run gen` | 简化版 | `licenses.txt` | 日常发货 |
| `npm run gen 10` | 简化版（10个） | `licenses.txt` | 批量准备 |
| `npm run generate:license` | 完整版 | `licenses-时间戳.txt` | 长期保存 |
| `npm run generate:license 20` | 完整版（20个） | `licenses-时间戳.txt` | 大量备货 |

---

## 🎨 自定义密钥格式

如果想要不同格式的密钥，可以修改 `generate-license-simple.js`：

### 当前格式（4-4-4-4）
```
EA59-4D26-058B-AA49
```

### 修改为 6-6 格式
```javascript
function generateLicense() {
  return crypto.randomBytes(6)
    .toString('hex')
    .toUpperCase()
    .match(/.{1,6}/g)
    .join('-');
}
// 输出：EA594D-26058B
```

### 修改为纯数字
```javascript
function generateLicense() {
  return Math.random().toString().slice(2, 18);
}
// 输出：1234567890123456
```

---

## 🔒 安全建议

### 1. 不要公开分享密钥

- ❌ 不要发到公开论坛
- ❌ 不要截图发朋友圈
- ✅ 只通过闲鱼私信发送

### 2. 记录已使用的密钥

创建 `used-licenses.txt` 记录：
```
EA59-4D26-058B-AA49 - 2024-01-15 - 张三 - XY123456
389F-100F-E3E0-D202 - 2024-01-16 - 李四 - XY123457
```

### 3. 定期清理旧文件

```bash
# 删除 30 天前的许可证文件
find . -name "licenses-*.txt" -mtime +30 -delete
```

---

## 🐛 常见问题

### Q1: 找不到生成的文件

**解决：**
```bash
# 查看当前目录
pwd

# 列出所有许可证文件
ls -la licenses*.txt

# 如果还是找不到，搜索整个项目
find . -name "licenses*.txt"
```

### Q2: 密钥格式不对

**检查：**
- 正确格式：`XXXX-XXXX-XXXX-XXXX`
- 全部大写字母和数字
- 用连字符 `-` 分隔

### Q3: 想要更短的密钥

**修改代码：**
```javascript
// 在 generate-license-simple.js 中
function generateLicense() {
  return crypto.randomBytes(4)  // 改为 4
    .toString('hex')
    .toUpperCase()
    .match(/.{1,4}/g)
    .join('-');
}
// 输出：EA59-4D26
```

---

## 📊 批量管理

### 提前生成 100 个密钥

```bash
npm run generate:license 100
```

### 导入到 Excel

1. 打开生成的文件
2. 复制所有密钥
3. 粘贴到 Excel
4. 添加列：订单号、买家、状态

### 使用数据库（进阶）

如果订单量很大，可以使用数据库管理：

```sql
CREATE TABLE licenses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  license_key VARCHAR(20) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  used_at TIMESTAMP NULL,
  order_id VARCHAR(50),
  buyer_name VARCHAR(50),
  status ENUM('unused', 'used', 'expired')
);
```

---

## 🚀 快速参考

**最常用的命令：**

```bash
# 生成 1 个密钥（最常用）
npm run gen

# 生成 10 个密钥（批量准备）
npm run gen 10

# 查看生成的密钥
cat licenses.txt
```

**发货模板：**

```
感谢购买！您的许可证密钥：

[粘贴密钥]

激活步骤：设置 → 许可证 → 输入密钥 → 激活

有问题随时联系 😊
```

就这么简单！🎉
