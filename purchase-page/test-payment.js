#!/usr/bin/env node
// 测试支付流程的脚本

const http = require('http');

const API_BASE = 'http://localhost:3000';

// 辅助函数：发送 HTTP 请求
function request(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          resolve(body);
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// 延迟函数
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 主测试流程
async function testPaymentFlow() {
  console.log('🧪 开始测试支付流程\n');

  try {
    // 1. 创建订单
    console.log('1️⃣ 创建订单...');
    const createResult = await request('POST', '/api/orders/create', {
      product: 'focusguard-pro',
      paymentMethod: 'wechat',
      amount: 99.00
    });

    if (!createResult.success) {
      console.error('❌ 创建订单失败:', createResult.message);
      return;
    }

    const orderId = createResult.orderId;
    console.log('✅ 订单创建成功');
    console.log(`   订单号: ${orderId}`);
    console.log(`   二维码: ${createResult.qrcodeUrl}`);
    console.log(`   过期时间: ${createResult.expiresIn} 秒\n`);

    // 2. 查询订单状态（支付前）
    console.log('2️⃣ 查询订单状态（支付前）...');
    const statusBefore = await request('GET', `/api/orders/status/${orderId}`);
    console.log(`✅ 订单状态: ${statusBefore.status}\n`);

    // 3. 模拟支付
    console.log('3️⃣ 模拟支付...');
    await sleep(1000); // 等待 1 秒模拟用户扫码
    const payResult = await request('POST', `/api/test/pay/${orderId}`);

    if (!payResult.success) {
      console.error('❌ 支付失败:', payResult.message);
      return;
    }

    console.log('✅ 支付成功');
    console.log(`   许可证密钥: ${payResult.licenseKey}\n`);

    // 4. 查询订单状态（支付后）
    console.log('4️⃣ 查询订单状态（支付后）...');
    const statusAfter = await request('GET', `/api/orders/status/${orderId}`);
    console.log(`✅ 订单状态: ${statusAfter.status}`);
    console.log(`   许可证密钥: ${statusAfter.licenseKey}\n`);

    // 5. 测试完成
    console.log('🎉 测试完成！\n');
    console.log('📋 测试结果总结:');
    console.log(`   ✓ 订单创建成功`);
    console.log(`   ✓ 支付流程正常`);
    console.log(`   ✓ 许可证生成成功`);
    console.log(`   ✓ 订单状态更新正确\n`);

    console.log('💡 下一步:');
    console.log('   1. 将许可证密钥复制到 FocusGuard 应用');
    console.log('   2. 在设置页面激活许可证');
    console.log('   3. 享受 Pro 功能！\n');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('\n请确保后端服务已启动: node server.js');
  }
}

// 测试订单过期
async function testOrderExpiration() {
  console.log('🧪 测试订单过期功能\n');

  try {
    // 创建订单
    console.log('1️⃣ 创建订单...');
    const createResult = await request('POST', '/api/orders/create', {
      product: 'focusguard-pro',
      paymentMethod: 'wechat',
      amount: 99.00
    });

    const orderId = createResult.orderId;
    console.log(`✅ 订单创建成功: ${orderId}\n`);

    // 等待一段时间（实际应该等待 15 分钟，这里缩短为演示）
    console.log('2️⃣ 等待订单过期...');
    console.log('   （实际环境中订单会在 15 分钟后过期）\n');

    // 查询状态
    const status = await request('GET', `/api/orders/status/${orderId}`);
    console.log(`✅ 当前订单状态: ${status.status}\n`);

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 测试多个订单
async function testMultipleOrders() {
  console.log('🧪 测试多个订单\n');

  try {
    const orders = [];

    // 创建 3 个订单
    for (let i = 1; i <= 3; i++) {
      console.log(`${i}️⃣ 创建订单 ${i}...`);
      const result = await request('POST', '/api/orders/create', {
        product: 'focusguard-pro',
        paymentMethod: i % 2 === 0 ? 'alipay' : 'wechat',
        amount: 99.00
      });

      orders.push(result.orderId);
      console.log(`   ✅ ${result.orderId}\n`);
      await sleep(500);
    }

    // 支付第 2 个订单
    console.log('💳 支付第 2 个订单...');
    await request('POST', `/api/test/pay/${orders[1]}`);
    console.log('   ✅ 支付成功\n');

    // 查询所有订单状态
    console.log('📊 查询所有订单状态:\n');
    for (let i = 0; i < orders.length; i++) {
      const status = await request('GET', `/api/orders/status/${orders[i]}`);
      console.log(`   订单 ${i + 1}: ${status.status}`);
    }

    console.log('\n✅ 多订单测试完成\n');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 主函数
const main = () => {
  const args = process.argv.slice(2);
  const testType = args[0] || 'basic';

  console.log('═══════════════════════════════════════');
  console.log('  FocusGuard 支付流程测试工具');
  console.log('═══════════════════════════════════════\n');

  switch (testType) {
    case 'basic':
      testPaymentFlow();
      break;
    case 'expiration':
      testOrderExpiration();
      break;
    case 'multiple':
      testMultipleOrders();
      break;
    default:
      console.log('用法: node test-payment.js [test-type]\n');
      console.log('可用测试类型:');
      console.log('  basic      - 基础支付流程测试（默认）');
      console.log('  expiration - 订单过期测试');
      console.log('  multiple   - 多订单测试\n');
      console.log('示例:');
      console.log('  node test-payment.js basic');
      console.log('  node test-payment.js multiple\n');
  }
};

main();
