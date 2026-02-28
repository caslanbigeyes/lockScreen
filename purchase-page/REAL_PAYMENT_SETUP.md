# 真实支付接入指南

## 🎯 目标

将测试支付替换为真实的微信支付/支付宝支付。

## 📋 准备清单

### 必需材料
- [ ] 营业执照（个体户或公司）
- [ ] 法人身份证
- [ ] 银行账户信息
- [ ] 联系人信息（手机、邮箱）

### 可选但推荐
- [ ] 域名（用于回调 URL）
- [ ] SSL 证书（HTTPS）
- [ ] 服务器（阿里云/腾讯云）

## 🚀 方案选择

### 方案对比

| 特性 | 微信支付 | 支付宝 | LemonSqueezy |
|------|---------|--------|--------------|
| 需要营业执照 | ✅ 是 | ✅ 是 | ❌ 否 |
| 审核时间 | 1-2 周 | 1-2 周 | 5 分钟 |
| 手续费 | 0.6% | 0.6% | ~8% |
| 支持国内用户 | ✅ 优秀 | ✅ 优秀 | ⚠️ 一般 |
| 技术难度 | 中等 | 中等 | 简单 |
| 推荐指数 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

### 推荐方案

**个人开发者/快速验证：** LemonSqueezy
**正式商业化：** 微信支付 + 支付宝

## 📝 微信支付接入（详细步骤）

### 第 1 步：申请微信支付商户

1. **访问商户平台**
   - 网址：https://pay.weixin.qq.com
   - 点击"立即注册"

2. **选择主体类型**
   - 企业：需要公司营业执照
   - 个体工商户：需要个体户营业执照
   - 推荐：个体工商户（门槛较低）

3. **填写基本信息**
   ```
   商户名称：你的公司/店铺名称
   经营类目：软件/应用
   经营场景：PC 网站/APP
   ```

4. **上传资质材料**
   - 营业执照照片（清晰、完整）
   - 法人身份证正反面
   - 银行开户许可证
   - 经营场所照片（门店/办公室）

5. **填写结算信息**
   - 对公账户信息
   - 或个体户的法人银行卡

6. **等待审核**
   - 通常 1-3 个工作日
   - 审核通过后会收到邮件和短信

### 第 2 步：签约 Native 支付

1. 登录商户平台
2. 进入"产品中心"
3. 找到"Native 支付"（扫码支付）
4. 点击"申请开通"
5. 等待审核（通常当天通过）

### 第 3 步：获取配置信息

1. **获取 AppID**
   - 路径：账户中心 → 商户信息 → AppID
   - 格式：`wx1234567890abcdef`

2. **获取商户号**
   - 路径：账户中心 → 商户信息 → 商户号
   - 格式：`1234567890`

3. **设置 API 密钥**
   - 路径：账户中心 → API 安全 → 设置密钥
   - 要求：32 位字符串（大小写字母+数字）
   - 示例：`Abc123Def456Ghi789Jkl012Mno345`
   - ⚠️ 重要：设置后立即保存，无法再次查看

4. **下载 API 证书**
   - 路径：账户中心 → API 安全 → 下载证书
   - 文件：`apiclient_cert.p12`
   - 保存到：`purchase-page/cert/`

### 第 4 步：配置代码

1. **安装 SDK**
   ```bash
   cd purchase-page
   npm install wechatpay-node-v3
   ```

2. **创建 .env 文件**
   ```bash
   cp .env.example .env
   nano .env
   ```

3. **填入配置**
   ```env
   WECHAT_APP_ID=wx1234567890abcdef
   WECHAT_MCH_ID=1234567890
   WECHAT_API_KEY=Abc123Def456Ghi789Jkl012Mno345
   WECHAT_NOTIFY_URL=https://your-domain.com/api/payment/wechat/notify
   ```

4. **修改 server.js**

找到 `createWechatPayQRCode` 函数，替换为：

```javascript
const WxPay = require('wechatpay-node-v3');
const fs = require('fs');
const path = require('path');

// 初始化微信支付
const wxpay = new WxPay({
  appid: process.env.WECHAT_APP_ID,
  mchid: process.env.WECHAT_MCH_ID,
  private_key: fs.readFileSync(path.join(__dirname, 'cert', 'apiclient_key.pem')),
  serial_no: 'YOUR_CERTIFICATE_SERIAL_NO', // 在商户平台查看
});

async function createWechatPayQRCode(orderId, amount) {
  try {
    const result = await wxpay.transactions_native({
      description: 'FocusGuard Pro 永久版',
      out_trade_no: orderId,
      notify_url: process.env.WECHAT_NOTIFY_URL,
      amount: {
        total: Math.round(amount * 100), // 转换为分
        currency: 'CNY'
      }
    });

    return result.code_url; // 返回支付二维码链接
  } catch (error) {
    console.error('微信支付创建订单失败:', error);
    throw error;
  }
}
```

### 第 5 步：配置回调 URL

1. **需要公网可访问的域名**
   - 购买域名（如 `buy.focusguard.com`）
   - 配置 DNS 解析到你的服务器

2. **配置 HTTPS**
   ```bash
   # 安装 certbot
   sudo apt-get install certbot python3-certbot-nginx
   
   # 获取 SSL 证书
   sudo certbot --nginx -d buy.focusguard.com
   ```

3. **在微信商户平台配置回调域名**
   - 路径：产品中心 → 开发配置 → 支付回调 URL
   - 填入：`https://buy.focusguard.com/api/payment/wechat/notify`

### 第 6 步：测试

1. **使用沙箱环境测试**
   - 微信提供沙箱环境用于测试
   - 路径：开发者中心 → 沙箱环境

2. **真实小额测试**
   - 创建 ¥0.01 的测试订单
   - 实际支付测试
   - 验证回调是否正常

## 📝 支付宝接入（详细步骤）

### 第 1 步：注册开放平台

1. 访问 https://open.alipay.com
2. 注册并完成实名认证
3. 创建应用（选择"网页/移动应用"）

### 第 2 步：申请当面付

1. 在应用中心选择"当面付"
2. 填写应用信息
3. 上传资质材料
4. 等待审核

### 第 3 步：配置密钥

1. **生成 RSA 密钥对**
   ```bash
   # 使用支付宝提供的工具
   # 下载：https://opendocs.alipay.com/common/02kipl
   
   # 或使用 OpenSSL
   openssl genrsa -out app_private_key.pem 2048
   openssl rsa -in app_private_key.pem -pubout -out app_public_key.pem
   ```

2. **上传公钥到支付宝**
   - 复制 `app_public_key.pem` 的内容
   - 在开放平台上传

3. **获取支付宝公钥**
   - 上传后会显示支付宝公钥
   - 保存为 `alipay_public_key.pem`

### 第 4 步：配置代码

```javascript
const AlipaySdk = require('alipay-sdk').default;

const alipaySdk = new AlipaySdk({
  appId: process.env.ALIPAY_APP_ID,
  privateKey: fs.readFileSync(path.join(__dirname, 'cert', 'app_private_key.pem'), 'utf-8'),
  alipayPublicKey: fs.readFileSync(path.join(__dirname, 'cert', 'alipay_public_key.pem'), 'utf-8'),
  gateway: 'https://openapi.alipay.com/gateway.do',
});

async function createAlipayQRCode(orderId, amount) {
  try {
    const result = await alipaySdk.exec('alipay.trade.precreate', {
      notify_url: process.env.ALIPAY_NOTIFY_URL,
      bizContent: {
        out_trade_no: orderId,
        total_amount: amount.toFixed(2),
        subject: 'FocusGuard Pro 永久版',
      }
    });

    return result.qr_code; // 返回支付二维码链接
  } catch (error) {
    console.error('支付宝创建订单失败:', error);
    throw error;
  }
}
```

## 🔐 安全建议

### 1. 验证回调签名

```javascript
// 微信支付回调验证
app.post('/api/payment/wechat/notify', async (req, res) => {
  // 验证签名
  const signature = req.headers['wechatpay-signature'];
  const timestamp = req.headers['wechatpay-timestamp'];
  const nonce = req.headers['wechatpay-nonce'];
  
  // 使用 SDK 验证
  const isValid = wxpay.verifySignature(signature, timestamp, nonce, req.body);
  
  if (!isValid) {
    return res.status(400).send('签名验证失败');
  }
  
  // 处理支付结果...
});
```

### 2. 防止重复通知

```javascript
const processedNotifications = new Set();

app.post('/api/payment/wechat/notify', async (req, res) => {
  const transactionId = req.body.transaction_id;
  
  if (processedNotifications.has(transactionId)) {
    return res.send('SUCCESS'); // 已处理过
  }
  
  processedNotifications.add(transactionId);
  
  // 处理支付...
});
```

### 3. 记录日志

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'payment.log' })
  ]
});

// 记录所有支付相关操作
logger.info('订单创建', { orderId, amount });
logger.info('支付成功', { orderId, transactionId });
```

## 💰 成本估算

### 开发测试阶段
- 域名：¥50/年
- 服务器：¥100/月（最低配置）
- SSL 证书：免费（Let's Encrypt）
- 总计：约 ¥1,250/年

### 运营阶段
- 微信支付手续费：0.6%
- 支付宝手续费：0.6%
- 例如：月销售 100 份（¥9,900），手续费约 ¥60

## 📞 常见问题

### Q1: 个人可以申请吗？

A: 需要营业执照。可以：
1. 注册个体工商户（推荐，成本低）
2. 使用 LemonSqueezy（无需营业执照）

### Q2: 审核需要多久？

A: 
- 微信支付：1-2 周
- 支付宝：1-2 周
- LemonSqueezy：5 分钟

### Q3: 如何测试？

A:
1. 使用沙箱环境
2. 创建 ¥0.01 的测试订单
3. 实际支付测试

### Q4: 回调 URL 必须是 HTTPS 吗？

A: 是的，生产环境必须使用 HTTPS。

### Q5: 可以同时支持微信和支付宝吗？

A: 可以！代码已经支持，只需要都配置即可。

## 🎯 下一步

1. **选择方案**：微信支付 vs 支付宝 vs LemonSqueezy
2. **准备材料**：营业执照等
3. **提交申请**：等待审核
4. **配置代码**：按照上面的步骤
5. **测试验证**：确保流程正常
6. **正式上线**：开始销售！

## 📚 参考文档

- [微信支付开发文档](https://pay.weixin.qq.com/wiki/doc/api/index.html)
- [支付宝开放平台文档](https://opendocs.alipay.com/open/270)
- [LemonSqueezy 文档](https://docs.lemonsqueezy.com)

祝你顺利接入支付！🚀
