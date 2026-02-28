# 数学答题问题调试指南

## 问题描述

用户反馈：解锁后进行数学计算答题时，算的结果是对的，但还是显示错误。

## 已修复的问题

### 1. Input 类型问题

**问题：** `math.html` 中使用 `<input type="number">`，这可能导致：
- 输入框为空时，`value` 是空字符串 `""`
- `Number("")` 会转换为 `0`，导致误判
- 某些浏览器对 `type="number"` 的处理不一致

**修复：** 改为 `<input type="text" inputmode="numeric">`
- `type="text"` 避免浏览器特殊处理
- `inputmode="numeric"` 在移动设备上显示数字键盘
- 手动验证输入是否为有效数字

### 2. 空输入验证

**问题：** 没有检查输入是否为空或无效

**修复：** 在 `math.js` 中添加验证：
```javascript
const inputValue = answerEl.value.trim();
if (inputValue === '') {
  console.log('输入为空，不提交');
  return;
}
const v = Number(inputValue);
if (isNaN(v)) {
  console.log('输入不是有效数字:', inputValue);
  return;
}
```

### 3. Payload 验证

**问题：** 主进程没有验证 payload 是否有效

**修复：** 在 `main.js` 中添加验证：
```javascript
if (!payload || payload.answer === undefined || payload.answer === null) {
  console.log('无效的 payload:', payload);
  return;
}
```

### 4. 调试日志

**添加：** 在关键位置添加详细的调试日志
- 题目生成时：显示题目、答案、难度
- 用户提交时：显示输入值、转换后的数字
- 验证时：显示用户答案、正确答案、比较结果

## 测试步骤

### 1. 启动应用并查看控制台

```bash
npm start
```

应用启动后，打开开发者工具（View → Toggle Developer Tools）查看控制台输出。

### 2. 触发数学答题

1. 点击"开始专注"
2. 等待锁屏（或设置很短的专注时间，如 10 秒）
3. 解锁电脑
4. 应该会弹出数学答题窗口

### 3. 查看控制台日志

在题目显示时，控制台应该输出：
```
=== 生成数学题 ===
题目: 45 + 23
答案: 68 (类型: number)
难度: 1
================
```

### 4. 输入答案并提交

输入正确答案（例如 68），点击"确认"或按 Enter。

控制台应该输出：
```
提交答案: 68 (输入值: 68)

=== 数学答题验证 ===
Payload: { answer: 68 }
用户答案: 68 (类型: number)
正确答案: 68 (类型: number)
是否通过: true
严格相等: true
==================
```

### 5. 测试不同情况

测试以下情况，查看日志：

**正确答案：**
- 输入正确的数字
- 应该通过验证，关闭答题窗口

**错误答案：**
- 输入错误的数字
- 应该显示答错，重新锁屏

**空输入：**
- 不输入任何内容，直接点击确认
- 应该在渲染进程控制台看到 "输入为空，不提交"
- 不会提交到主进程

**无效输入：**
- 输入非数字字符（如果可能）
- 应该被拦截

## 可能的问题和解决方案

### 问题 1：负数答案

**现象：** Level 1 的减法可能产生负数（如 23 - 45 = -22）

**检查：** 查看控制台日志，确认答案是否为负数

**解决：** 如果需要避免负数，修改 `main.js` 中的减法逻辑：
```javascript
// Level 1: 确保 a > b，避免负数
a = Math.floor(Math.random() * 90) + 10;
b = Math.floor(Math.random() * 90) + 10;
if (Math.random() < 0.5) {
  op = "+";
  ans = a + b;
} else {
  op = "-";
  // 确保 a >= b
  if (a < b) [a, b] = [b, a];
  ans = a - b;
}
display = `${a} ${op} ${b}`;
```

### 问题 2：浮点数精度

**现象：** 某些计算可能产生浮点数精度问题

**检查：** 查看控制台日志，确认答案类型和值

**当前状态：** 所有题目都是整数运算，不应该有浮点数问题

### 问题 3：输入法问题

**现象：** 使用中文输入法时，可能输入全角数字

**解决：** 已使用 `trim()` 和 `Number()` 转换，应该能处理

**测试：** 尝试输入全角数字（１２３）看是否能正确转换

### 问题 4：多次点击提交

**现象：** 用户可能快速多次点击"确认"按钮

**当前状态：** 每次点击都会提交，但主进程只处理一次（因为窗口会关闭）

**改进（可选）：** 添加防抖或禁用按钮：
```javascript
let isSubmitting = false;

submitBtn.addEventListener("click", () => {
  if (isSubmitting) return;
  isSubmitting = true;
  
  // ... 提交逻辑 ...
  
  // 可选：1秒后重新启用
  setTimeout(() => { isSubmitting = false; }, 1000);
});
```

## 调试技巧

### 1. 查看完整日志

在终端运行应用，可以看到主进程的日志：
```bash
npm start
```

在开发者工具中，可以看到渲染进程的日志。

### 2. 手动测试特定题目

修改 `randomProblem` 函数，返回固定题目：
```javascript
const randomProblem = (level) => {
  // 测试用固定题目
  const a = 45;
  const b = 23;
  const ans = a + b; // 68
  const display = `${a} + ${b}`;
  
  expectedAnswer = ans;
  console.log('=== 生成数学题 ===');
  console.log('题目:', display);
  console.log('答案:', ans, '(类型:', typeof ans, ')');
  console.log('难度:', level);
  console.log('================');
  return { display, level };
};
```

### 3. 添加更多日志

在 `math.js` 中添加：
```javascript
// 监听输入变化
answerEl.addEventListener('input', (e) => {
  console.log('输入变化:', e.target.value);
});

// 监听焦点
answerEl.addEventListener('focus', () => {
  console.log('输入框获得焦点');
});
```

### 4. 检查 IPC 通信

在 `preload.js` 中添加日志：
```javascript
submitAnswer: (payload) => {
  console.log('IPC 发送 math-answer:', payload);
  ipcRenderer.send("math-answer", payload);
}
```

## 常见错误模式

### 模式 1：答案总是判错

**可能原因：**
- `expectedAnswer` 未正确设置
- 类型不匹配（字符串 vs 数字）
- 精度问题

**检查：** 查看日志中的类型和值

### 模式 2：特定题目判错

**可能原因：**
- 负数答案
- 特殊字符（如 ²）显示问题
- 计算逻辑错误

**检查：** 记录出错的题目，手动验证计算

### 模式 3：随机判错

**可能原因：**
- 竞态条件（多次提交）
- 内存中的 `expectedAnswer` 被覆盖
- 定时器问题

**检查：** 查看是否有多个答题窗口同时存在

## 下一步

1. **运行应用并测试**
   ```bash
   npm start
   ```

2. **查看控制台日志**
   - 主进程日志在终端
   - 渲染进程日志在开发者工具

3. **记录问题**
   - 记录出错时的完整日志
   - 记录题目和输入的答案
   - 截图或录屏

4. **反馈**
   - 提供日志信息
   - 说明具体哪个题目出错
   - 说明输入的答案和期望的结果

## 修改的文件

- `math.html` - 改 input type 为 text
- `math.js` - 添加输入验证和日志
- `main.js` - 添加 payload 验证和详细日志
- `test-math-problems.js` - 数学逻辑测试脚本

## 测试脚本

运行数学逻辑测试：
```bash
node test-math-problems.js
```

应该看到所有测试通过。

---

**修复时间：** 2026-02-28

**状态：** ✅ 已添加调试日志和输入验证，等待用户测试反馈
