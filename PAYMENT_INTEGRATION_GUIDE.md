# FocusGuard 支付集成完整指南

## 📖 流程概述

你的理解完全正确！完整流程如下：

```
用户点击"立即购买"
    ↓
选择支付方式（微信/支付宝）
    ↓
后端创建订单，生成支付二维码
    ↓
前端显示二维码
    ↓
用户扫码支付
    ↓
支付平台（微信/支付宝）回调后端
    ↓
后端验证支付，生成许可证密钥
    ↓
前端轮询订单状态，获取许可证
    ↓
显示许可证密钥给用户
    ↓
用户复制密钥到应用中激活
    ↓
完成！
```

## 🎯 已创建的文件

### 1. 购买页面前端 (`purchase-page/index.html`)
- 精美的购买页面设计
- 支持微信支付和支付宝
- 二维码展示
- 支付状态轮询
- 许可证密钥显示和复制

### 2. 后端服务 (`purchase-page/server.js`)
- 订单创建 API
- 支付回调处理
- 许可证生成
- 订单状态查询

### 3. 配置文件 (`purchase-page/package.json`)
- 依赖管理
- 启动脚本

### 4. 测试脚本 (`purchase-page/test-payment.js`)
- 完整流程测试
- 订单过期测试
- 多订单测试

### 5. 部署文档 (`purchase-page/README.md`)
- 详细的部署步骤
- 微信支付接入指南
- 支付宝接入指南
- 安全建议

## 🚀 快速开始（3 步）

### 步骤 1：启动后端服务

```bash
cd purchase-page
npm install
node server.js
```

服务将运行在 `http://localhost:3000`

### 步骤 2：打开购买页面

在浏览器中打开 `purchase-page/index.html`

### 步骤 3：测试支付流程

```bash
# 在另一个终端运行测试
node test-payment.js
```

## 💡 三种接入方案对比

### 方案 A：自建支付系统（已实现）

**优点：**
- ✅ 完全控制用户体验
- ✅ 无需支付额外手续费（只有支付平台费用）
- ✅ 可以自定义所有流程
- ✅ 数据完全掌握在自己手中

**缺点：**
- ❌ 需要申请微信/支付宝商户
- ❌ 需要自己维护服务器
- ❌ 需要处理退款等售后

**适合：** 有技术团队，预期销量较大

**成本：**
- 服务器：¥100/月
- 域名：¥50/年
- 微信支付费率：0.6%
- 总计：约 ¥1,250/年 + 0.6% 交易费

### 方案 B：使用 LemonSqueezy（推荐新手）

**优点：**
- ✅ 5 分钟即可上线
- ✅ 自动处理支付、退款、发票
- ✅ 自动发送许可证邮件
- ✅ 支持全球支付方式
- ✅ 无需服务器

**缺点：**
- ❌ 手续费较高（5% + 支付费用）
- ❌ 界面定制受限
- ❌ 依赖第三方服务

**适合：** 个人开发者，快速验证市场

**成本：**
- 平台费：5%
- 支付费用：约 2.9% + $0.30
- 总计：约 8% 交易费

### 方案 C：混合方案（推荐）

**实现方式：**
1. 初期使用 LemonSqueezy 快速上线
2. 销量稳定后切换到自建系统
3. 或者同时提供两种方式

**优点：**
- ✅ 快速启动
- ✅ 后期可优化成本
- ✅ 灵活性最高

## 🔧 实际部署步骤

### 1. 申请微信支付（需要 1-2 周）

1. 准备材料：
   - 营业执照
   - 法人身份证
   - 银行账户信息

2. 访问 [微信支付商户平台](https://pay.weixin.qq.com)

3. 提交申请并等待审核

4. 审核通过后获取：
   - AppID
   - 商户号
   - API 密钥

### 2. 配置服务器

```bash
# 购买服务器（推荐阿里云/腾讯云）
# 最低配置：1核2G，约 ¥100/月

# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 上传代码
git clone your-repo
cd purchase-page
npm install

# 配置环境变量
cp .env.example .env
nano .env  # 填入你的配置

# 启动服务（使用 PM2）
npm install -g pm2
pm2 start server.js --name focusguard-purchase
pm2 save
pm2 startup
```

### 3. 配置域名和 SSL

```bash
# 安装 Nginx
sudo apt-get install nginx

# 配置反向代理
sudo nano /etc/nginx/sites-available/focusguard

# 添加配置：
server {
    listen 80;
    server_name buy.focusguard.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# 启用配置
sudo ln -s /etc/nginx/sites-available/focusguard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 安装 SSL 证书（Let's Encrypt）
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d buy.focusguard.com
```

### 4. 更新应用配置

在 `license.js` 中更新购买链接：

```javascript
const PURCHASE_URL = "https://buy.focusguard.com";
```

### 5. 测试完整流程

1. 访问购买页面
2. 点击"立即购买"
3. 扫码支付（使用测试金额 0.01 元）
4. 验证许可证生成
5. 在应用中激活许可证

## 📊 数据监控

### 关键指标

1. **转化率**：访问购买页面 → 完成支付
2. **支付成功率**：创建订单 → 支付成功
3. **激活率**：获得许可证 → 激活成功

### 监控工具

```javascript
// 在 server.js 中添加统计
const stats = {
  pageViews: 0,
  ordersCreated: 0,
  ordersPaid: 0,
  licensesActivated: 0
};

// 记录页面访问
app.get('/api/stats/pageview', (req, res) => {
  stats.pageViews++;
  res.json({ success: true });
});

// 查看统计
app.get('/api/stats', (req, res) => {
  res.json({
    ...stats,
    conversionRate: (stats.ordersPaid / stats.pageViews * 100).toFixed(2) + '%',
    paymentSuccessRate: (stats.ordersPaid / stats.ordersCreated * 100).toFixed(2) + '%'
  });
});
```

## 🎨 页面定制

### 修改价格

在 `index.html` 中搜索 `¥99` 并替换为你的价格。

### 修改功能列表

在 `index.html` 的 `.feature-list` 部分修改。

### 修改颜色主题

在 `<style>` 标签中修改：

```css
/* 主色调 */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* 改为其他颜色，例如绿色 */
background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
```

## 🔐 安全检查清单

部署前必须检查：

- [ ] 使用 HTTPS（SSL 证书）
- [ ] 验证支付回调签名
- [ ] 设置 CORS 白名单
- [ ] 添加请求限流
- [ ] 记录所有支付日志
- [ ] 定期备份数据库
- [ ] 设置异常告警
- [ ] 测试退款流程

## 💰 定价建议

根据市场调研，类似工具的定价：

- **永久版**：¥99 - ¥199（推荐 ¥99）
- **年费版**：¥49 - ¥99/年
- **月费版**：¥9 - ¥19/月

建议策略：
1. 初期使用永久版 ¥99 吸引用户
2. 提供限时优惠（如首发 ¥79）
3. 后期可增加订阅制选项

## 📧 客服支持

### 常见问题准备

1. **支付后没收到许可证**
   - 检查邮箱垃圾箱
   - 提供订单号查询
   - 手动补发许可证

2. **许可证激活失败**
   - 检查网络连接
   - 验证密钥格式
   - 检查是否已在其他设备激活

3. **申请退款**
   - 7 天内无理由退款
   - 提供订单号和购买凭证
   - 1-3 个工作日处理

### 客服邮箱模板

```
主题：FocusGuard Pro 购买咨询

您好，

感谢您对 FocusGuard Pro 的关注！

如有任何问题，请提供以下信息：
1. 订单号（如已购买）
2. 问题描述
3. 联系方式

我们将在 24 小时内回复。

祝您使用愉快！

FocusGuard 团队
support@focusguard.com
```

## 🎉 上线后的工作

1. **营销推广**
   - 在产品介绍页添加购买链接
   - 社交媒体宣传
   - 提供试用版下载

2. **用户反馈**
   - 收集用户评价
   - 优化购买流程
   - 改进产品功能

3. **数据分析**
   - 监控转化率
   - 分析用户行为
   - A/B 测试优化

## 📞 需要帮助？

如果在部署过程中遇到问题：

1. 查看 `purchase-page/README.md` 详细文档
2. 运行 `node test-payment.js` 测试
3. 检查服务器日志
4. 参考微信/支付宝官方文档

祝你的产品大卖！🚀
