# FocusGuard Pro 购买页面部署指南

## 📋 完整流程说明

### 用户购买流程

```
1. 用户点击"立即购买" 
   ↓
2. 选择支付方式（微信/支付宝）
   ↓
3. 后端创建订单，生成支付二维码
   ↓
4. 用户扫码支付
   ↓
5. 支付平台回调后端
   ↓
6. 后端生成许可证密钥
   ↓
7. 页面显示许可证密钥
   ↓
8. 用户复制密钥到应用中激活
```

## 🚀 快速开始

### 1. 安装依赖

```bash
cd purchase-page
npm init -y
npm install express cors crypto
npm install nodemailer  # 如果需要邮件功能
```

### 2. 配置环境变量

创建 `.env` 文件：

```env
# 服务器配置
PORT=3000
NODE_ENV=production

# 微信支付配置
WECHAT_APP_ID=your_wechat_app_id
WECHAT_MCH_ID=your_merchant_id
WECHAT_API_KEY=your_api_key
WECHAT_NOTIFY_URL=https://your-domain.com/api/payment/wechat/notify

# 支付宝配置
ALIPAY_APP_ID=your_alipay_app_id
ALIPAY_PRIVATE_KEY=your_private_key
ALIPAY_PUBLIC_KEY=alipay_public_key
ALIPAY_NOTIFY_URL=https://your-domain.com/api/payment/alipay/notify

# 邮件配置（可选）
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@focusguard.com
SMTP_PASS=your_password
```

### 3. 启动服务器

```bash
# 开发模式
node server.js

# 生产模式（使用 PM2）
npm install -g pm2
pm2 start server.js --name focusguard-purchase
```

### 4. 部署前端页面

将 `index.html` 部署到：
- 静态网站托管（如 Vercel、Netlify）
- 或与后端一起部署

修改 `index.html` 中的 API 地址：

```javascript
const API_BASE = 'https://your-api.example.com'; // 改为你的后端地址
```

## 💳 支付接入详细步骤

### 方案 A：微信支付（推荐国内用户）

#### 1. 注册微信支付商户

1. 访问 [微信支付商户平台](https://pay.weixin.qq.com)
2. 注册成为商户（需要营业执照）
3. 完成实名认证

#### 2. 获取配置信息

在商户平台获取：
- AppID（应用 ID）
- 商户号（Mch ID）
- API 密钥（API Key）

#### 3. 配置回调地址

在商户平台设置支付回调 URL：
```
https://your-domain.com/api/payment/wechat/notify
```

#### 4. 安装微信支付 SDK

```bash
npm install wechatpay-node-v3
```

#### 5. 实现支付接口

参考 `server.js` 中的注释部分，取消注释并配置：

```javascript
const WxPay = require('wechatpay-node-v3');

const pay = new WxPay({
  appid: WECHAT_PAY_CONFIG.appId,
  mchid: WECHAT_PAY_CONFIG.mchId,
  private_key: fs.readFileSync('./cert/apiclient_key.pem'),
  serial_no: 'your_certificate_serial_no',
});

async function createWechatPayQRCode(orderId, amount) {
  const result = await pay.transactions_native({
    description: 'FocusGuard Pro 永久版',
    out_trade_no: orderId,
    notify_url: WECHAT_PAY_CONFIG.notifyUrl,
    amount: {
      total: Math.round(amount * 100), // 转换为分
      currency: 'CNY'
    }
  });

  return result.code_url;
}
```

### 方案 B：支付宝（推荐国际用户）

#### 1. 注册支付宝开放平台

1. 访问 [支付宝开放平台](https://open.alipay.com)
2. 创建应用
3. 申请"当面付"产品

#### 2. 获取配置信息

- AppID
- 应用私钥
- 支付宝公钥

#### 3. 安装支付宝 SDK

```bash
npm install alipay-sdk
```

#### 4. 实现支付接口

```javascript
const AlipaySdk = require('alipay-sdk').default;

const alipaySdk = new AlipaySdk({
  appId: ALIPAY_CONFIG.appId,
  privateKey: ALIPAY_CONFIG.privateKey,
  alipayPublicKey: ALIPAY_CONFIG.publicKey,
  gateway: 'https://openapi.alipay.com/gateway.do',
});

async function createAlipayQRCode(orderId, amount) {
  const result = await alipaySdk.exec('alipay.trade.precreate', {
    notify_url: ALIPAY_CONFIG.notifyUrl,
    bizContent: {
      out_trade_no: orderId,
      total_amount: amount.toFixed(2),
      subject: 'FocusGuard Pro 永久版',
    }
  });

  return result.qr_code;
}
```

### 方案 C：使用 LemonSqueezy（最简单）

如果不想自己处理支付，可以使用 LemonSqueezy：

1. 在 [LemonSqueezy](https://lemonsqueezy.com) 创建账号
2. 创建产品和价格
3. 获取 Checkout URL
4. 直接跳转到 LemonSqueezy 的支付页面

优点：
- 无需处理支付接口
- 自动处理退款、发票
- 支持多种支付方式
- 自动发送许可证邮件

缺点：
- 需要支付手续费（约 5%）
- 界面定制受限

## 🔐 许可证系统集成

### 1. 许可证生成

后端在支付成功后自动生成许可证：

```javascript
function generateLicenseKey() {
  const segments = [];
  for (let i = 0; i < 4; i++) {
    segments.push(crypto.randomBytes(2).toString('hex').toUpperCase());
  }
  return segments.join('-'); // 格式：XXXX-XXXX-XXXX-XXXX
}
```

### 2. 许可证验证

用户在应用中激活时，调用 LemonSqueezy API 或你的后端 API 验证：

```javascript
// 在 license.js 中
const activate = async (licenseKey) => {
  // 调用你的后端验证接口
  const response = await fetch('https://your-api.com/api/license/activate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      license_key: licenseKey,
      device_id: getDeviceId()
    })
  });
  
  const result = await response.json();
  return result;
};
```

### 3. 后端验证接口

```javascript
app.post('/api/license/activate', (req, res) => {
  const { license_key, device_id } = req.body;
  
  const license = licenses.get(license_key);
  
  if (!license) {
    return res.json({ success: false, error: '许可证不存在' });
  }
  
  if (license.status === 'activated' && license.deviceId !== device_id) {
    return res.json({ success: false, error: '许可证已在其他设备激活' });
  }
  
  // 激活许可证
  license.status = 'activated';
  license.deviceId = device_id;
  license.activatedAt = Date.now();
  
  res.json({ success: true });
});
```

## 📧 邮件通知配置

### 使用 Nodemailer

```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendLicenseEmail(order) {
  const mailOptions = {
    from: '"FocusGuard" <noreply@focusguard.com>',
    to: order.email,
    subject: '感谢购买 FocusGuard Pro - 您的许可证密钥',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; background: #f9f9f9; }
          .license-box { background: white; border: 2px dashed #667eea; 
                         padding: 20px; margin: 20px 0; text-align: center; }
          .license-key { font-size: 24px; font-weight: bold; color: #667eea; 
                         font-family: monospace; letter-spacing: 2px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 欢迎使用 FocusGuard Pro！</h1>
          </div>
          <div class="content">
            <p>感谢您购买 FocusGuard Pro，以下是您的许可证信息：</p>
            
            <div class="license-box">
              <p style="margin-bottom: 10px;">您的许可证密钥</p>
              <div class="license-key">${order.licenseKey}</div>
            </div>
            
            <h3>如何激活</h3>
            <ol>
              <li>打开 FocusGuard 应用</li>
              <li>进入"设置" Tab</li>
              <li>在"许可证"区域粘贴上方密钥</li>
              <li>点击"激活"按钮</li>
              <li>享受 Pro 版本的全部功能！</li>
            </ol>
            
            <p>如有任何问题，请联系客服：support@focusguard.com</p>
          </div>
          <div class="footer">
            <p>订单号：${order.orderId}</p>
            <p>购买时间：${new Date(order.paidAt).toLocaleString('zh-CN')}</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  await transporter.sendMail(mailOptions);
}
```

## 🧪 测试

### 本地测试

1. 启动后端：
```bash
node server.js
```

2. 在浏览器打开 `index.html`

3. 使用测试接口模拟支付：
```bash
# 创建订单后，使用返回的 orderId
curl -X POST http://localhost:3000/api/test/pay/FG1234567890
```

### 生产环境测试

1. 使用微信/支付宝的沙箱环境
2. 测试完整支付流程
3. 验证回调处理
4. 测试许可证激活

## 📊 数据库设计（可选）

如果需要持久化存储，建议使用数据库：

### 订单表 (orders)

```sql
CREATE TABLE orders (
  id VARCHAR(50) PRIMARY KEY,
  product VARCHAR(50) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,
  license_key VARCHAR(50),
  transaction_id VARCHAR(100),
  email VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  paid_at TIMESTAMP,
  expires_at TIMESTAMP
);
```

### 许可证表 (licenses)

```sql
CREATE TABLE licenses (
  license_key VARCHAR(50) PRIMARY KEY,
  order_id VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  device_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  activated_at TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);
```

## 🔒 安全建议

1. **HTTPS**：生产环境必须使用 HTTPS
2. **签名验证**：验证支付回调的签名
3. **防重放**：记录已处理的回调，防止重复处理
4. **限流**：对 API 接口进行限流保护
5. **日志**：记录所有支付相关操作
6. **备份**：定期备份订单和许可证数据

## 📱 移动端适配

购买页面已经做了响应式设计，在移动端也能正常使用。

## 🌐 部署建议

### 推荐方案

1. **前端**：Vercel / Netlify（免费）
2. **后端**：阿里云 / 腾讯云服务器
3. **数据库**：MySQL / PostgreSQL
4. **域名**：购买并配置 SSL 证书

### 成本估算

- 域名：约 ¥50/年
- 服务器：约 ¥100/月（入门级）
- SSL 证书：免费（Let's Encrypt）
- 总计：约 ¥1,250/年

## 📞 技术支持

如有问题，请查看：
- [微信支付开发文档](https://pay.weixin.qq.com/wiki/doc/api/index.html)
- [支付宝开放平台文档](https://opendocs.alipay.com/open/270)
- [LemonSqueezy 文档](https://docs.lemonsqueezy.com)
