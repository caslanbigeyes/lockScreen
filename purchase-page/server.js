// server.js - 购买页面后端 API
// 处理订单创建、支付回调、许可证生成

const express = require('express');
const crypto = require('crypto');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// 配置
const PORT = 3000;
const WECHAT_PAY_CONFIG = {
  appId: process.env.WECHAT_APP_ID || 'your_app_id',
  mchId: process.env.WECHAT_MCH_ID || 'your_mch_id',
  apiKey: process.env.WECHAT_API_KEY || 'your_api_key',
  notifyUrl: process.env.WECHAT_NOTIFY_URL || 'https://your-domain.com/api/payment/wechat/notify'
};

const ALIPAY_CONFIG = {
  appId: process.env.ALIPAY_APP_ID || 'your_app_id',
  privateKey: process.env.ALIPAY_PRIVATE_KEY || 'your_private_key',
  publicKey: process.env.ALIPAY_PUBLIC_KEY || 'your_public_key',
  notifyUrl: process.env.ALIPAY_NOTIFY_URL || 'https://your-domain.com/api/payment/alipay/notify'
};

// 内存存储（生产环境应使用数据库）
const orders = new Map();
const licenses = new Map();

// 生成订单号
function generateOrderId() {
  return 'FG' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();
}

// 生成许可证密钥
function generateLicenseKey() {
  const segments = [];
  for (let i = 0; i < 4; i++) {
    segments.push(crypto.randomBytes(2).toString('hex').toUpperCase());
  }
  return segments.join('-');
}

// 创建订单
app.post('/api/orders/create', async (req, res) => {
  try {
    const { product, paymentMethod, amount } = req.body;

    // 验证参数
    if (!product || !paymentMethod || !amount) {
      return res.json({ success: false, message: '参数错误' });
    }

    // 创建订单
    const orderId = generateOrderId();
    const order = {
      orderId,
      product,
      paymentMethod,
      amount,
      status: 'pending',
      createdAt: Date.now(),
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 分钟过期
      licenseKey: null
    };

    orders.set(orderId, order);

    // 根据支付方式生成支付二维码
    let qrcodeUrl;
    if (paymentMethod === 'wechat') {
      qrcodeUrl = await createWechatPayQRCode(orderId, amount);
    } else if (paymentMethod === 'alipay') {
      qrcodeUrl = await createAlipayQRCode(orderId, amount);
    } else {
      return res.json({ success: false, message: '不支持的支付方式' });
    }

    res.json({
      success: true,
      orderId,
      qrcodeUrl,
      expiresIn: 900 // 15 分钟（秒）
    });

  } catch (error) {
    console.error('创建订单失败:', error);
    res.json({ success: false, message: '服务器错误' });
  }
});

// 查询订单状态
app.get('/api/orders/status/:orderId', (req, res) => {
  const { orderId } = req.params;
  const order = orders.get(orderId);

  if (!order) {
    return res.json({ success: false, message: '订单不存在' });
  }

  // 检查是否过期
  if (order.status === 'pending' && Date.now() > order.expiresAt) {
    order.status = 'expired';
  }

  res.json({
    success: true,
    status: order.status,
    licenseKey: order.licenseKey
  });
});

// 微信支付回调
app.post('/api/payment/wechat/notify', async (req, res) => {
  try {
    // 解析微信支付回调数据
    const { out_trade_no, transaction_id, result_code } = req.body;

    if (result_code === 'SUCCESS') {
      const order = orders.get(out_trade_no);
      if (order && order.status === 'pending') {
        // 生成许可证
        const licenseKey = generateLicenseKey();
        
        // 更新订单状态
        order.status = 'paid';
        order.licenseKey = licenseKey;
        order.paidAt = Date.now();
        order.transactionId = transaction_id;

        // 保存许可证
        licenses.set(licenseKey, {
          orderId: out_trade_no,
          createdAt: Date.now(),
          activatedAt: null,
          status: 'unused'
        });

        // TODO: 发送邮件通知用户
        await sendLicenseEmail(order);

        console.log(`订单 ${out_trade_no} 支付成功，许可证：${licenseKey}`);
      }
    }

    // 返回成功响应给微信
    res.send('<xml><return_code><![CDATA[SUCCESS]]></return_code></xml>');
  } catch (error) {
    console.error('微信支付回调处理失败:', error);
    res.send('<xml><return_code><![CDATA[FAIL]]></return_code></xml>');
  }
});

// 支付宝支付回调
app.post('/api/payment/alipay/notify', async (req, res) => {
  try {
    const { out_trade_no, trade_no, trade_status } = req.body;

    if (trade_status === 'TRADE_SUCCESS') {
      const order = orders.get(out_trade_no);
      if (order && order.status === 'pending') {
        // 生成许可证
        const licenseKey = generateLicenseKey();
        
        // 更新订单状态
        order.status = 'paid';
        order.licenseKey = licenseKey;
        order.paidAt = Date.now();
        order.transactionId = trade_no;

        // 保存许可证
        licenses.set(licenseKey, {
          orderId: out_trade_no,
          createdAt: Date.now(),
          activatedAt: null,
          status: 'unused'
        });

        // TODO: 发送邮件通知用户
        await sendLicenseEmail(order);

        console.log(`订单 ${out_trade_no} 支付成功，许可证：${licenseKey}`);
      }
    }

    res.send('success');
  } catch (error) {
    console.error('支付宝回调处理失败:', error);
    res.send('fail');
  }
});

// ========== 支付接口封装 ==========

// 创建微信支付二维码（简化版，实际需要调用微信 API）
async function createWechatPayQRCode(orderId, amount) {
  // 实际实现需要：
  // 1. 调用微信统一下单 API
  // 2. 获取 code_url
  // 3. 返回二维码链接
  
  // 这里返回模拟数据
  return `weixin://wxpay/bizpayurl?pr=mock_${orderId}`;
  
  /* 真实实现示例：
  const WxPay = require('wechatpay-node-v3');
  const pay = new WxPay({
    appid: WECHAT_PAY_CONFIG.appId,
    mchid: WECHAT_PAY_CONFIG.mchId,
    private_key: WECHAT_PAY_CONFIG.apiKey,
  });

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
  */
}

// 创建支付宝支付二维码（简化版）
async function createAlipayQRCode(orderId, amount) {
  // 实际实现需要：
  // 1. 调用支付宝当面付 API
  // 2. 获取二维码链接
  // 3. 返回二维码链接
  
  return `https://qr.alipay.com/mock_${orderId}`;
  
  /* 真实实现示例：
  const AlipaySdk = require('alipay-sdk').default;
  const alipaySdk = new AlipaySdk({
    appId: ALIPAY_CONFIG.appId,
    privateKey: ALIPAY_CONFIG.privateKey,
    alipayPublicKey: ALIPAY_CONFIG.publicKey,
  });

  const result = await alipaySdk.exec('alipay.trade.precreate', {
    notify_url: ALIPAY_CONFIG.notifyUrl,
    bizContent: {
      out_trade_no: orderId,
      total_amount: amount.toFixed(2),
      subject: 'FocusGuard Pro 永久版',
    }
  });

  return result.qr_code;
  */
}

// 发送许可证邮件
async function sendLicenseEmail(order) {
  // TODO: 实现邮件发送
  // 可以使用 nodemailer 或第三方邮件服务
  console.log(`发送许可证邮件到用户，订单：${order.orderId}，密钥：${order.licenseKey}`);
  
  /* 真实实现示例：
  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    host: 'smtp.example.com',
    port: 587,
    secure: false,
    auth: {
      user: 'noreply@focusguard.com',
      pass: 'your_password'
    }
  });

  await transporter.sendMail({
    from: '"FocusGuard" <noreply@focusguard.com>',
    to: order.email,
    subject: '感谢购买 FocusGuard Pro - 您的许可证密钥',
    html: `
      <h2>感谢购买 FocusGuard Pro！</h2>
      <p>您的许可证密钥：<strong>${order.licenseKey}</strong></p>
      <p>请在应用中激活使用。</p>
    `
  });
  */
}

// ========== 测试接口（仅用于开发） ==========

// 模拟支付成功（开发测试用）
app.post('/api/test/pay/:orderId', (req, res) => {
  const { orderId } = req.params;
  const order = orders.get(orderId);

  if (!order) {
    return res.json({ success: false, message: '订单不存在' });
  }

  if (order.status !== 'pending') {
    return res.json({ success: false, message: '订单状态错误' });
  }

  // 生成许可证
  const licenseKey = generateLicenseKey();
  
  // 更新订单
  order.status = 'paid';
  order.licenseKey = licenseKey;
  order.paidAt = Date.now();

  // 保存许可证
  licenses.set(licenseKey, {
    orderId,
    createdAt: Date.now(),
    activatedAt: null,
    status: 'unused'
  });

  res.json({
    success: true,
    message: '模拟支付成功',
    licenseKey
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`购买页面后端服务运行在 http://localhost:${PORT}`);
  console.log('');
  console.log('可用接口：');
  console.log(`  POST   /api/orders/create          - 创建订单`);
  console.log(`  GET    /api/orders/status/:id      - 查询订单状态`);
  console.log(`  POST   /api/payment/wechat/notify  - 微信支付回调`);
  console.log(`  POST   /api/payment/alipay/notify  - 支付宝支付回调`);
  console.log(`  POST   /api/test/pay/:id           - 模拟支付（测试用）`);
});

module.exports = app;
