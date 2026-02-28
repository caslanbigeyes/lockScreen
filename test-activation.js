// test-activation.js - 测试许可证激活功能
// 使用方法：node test-activation.js

const fs = require('fs');
const path = require('path');

// 模拟 Electron app.getPath
const mockApp = {
  getPath: (name) => {
    if (name === 'userData') {
      return path.join(__dirname, 'test-data');
    }
    return __dirname;
  }
};

// 替换 require('electron') 为模拟对象
require.cache[require.resolve('electron')] = {
  exports: { app: mockApp }
};

// 确保测试目录存在
const testDataDir = path.join(__dirname, 'test-data');
if (!fs.existsSync(testDataDir)) {
  fs.mkdirSync(testDataDir, { recursive: true });
}

// 清理旧的测试数据
const licenseFile = path.join(testDataDir, 'license.json');
if (fs.existsSync(licenseFile)) {
  fs.unlinkSync(licenseFile);
}

// 加载许可证模块
const license = require('./license');

console.log('╔════════════════════════════════════════════╗');
console.log('║   FocusGuard 许可证激活测试                ║');
console.log('╚════════════════════════════════════════════╝\n');

// 测试用例
const testCases = [
  {
    name: '有效密钥（标准格式）',
    key: '5B9A-212C-54D7-ADE5',
    shouldPass: true
  },
  {
    name: '有效密钥（小写）',
    key: '5b9a-212c-54d7-ade5',
    shouldPass: true
  },
  {
    name: '无效密钥（缺少短横线）',
    key: '5B9A212C54D7ADE5',
    shouldPass: false
  },
  {
    name: '无效密钥（格式不完整）',
    key: '5B9A-212C-54D7',
    shouldPass: false
  },
  {
    name: '无效密钥（包含非法字符）',
    key: '5B9A-212C-54D7-XXXX',
    shouldPass: false
  },
  {
    name: '空密钥',
    key: '',
    shouldPass: false
  }
];

// 运行测试
(async () => {
  let passed = 0;
  let failed = 0;

  for (const test of testCases) {
    console.log(`\n测试：${test.name}`);
    console.log(`密钥：${test.key || '(空)'}`);
    
    // 清理：每次测试前重置许可证状态
    if (fs.existsSync(licenseFile)) {
      fs.unlinkSync(licenseFile);
    }
    
    // 重新加载许可证模块以重置内存状态
    delete require.cache[require.resolve('./license')];
    const license = require('./license');
    
    const result = await license.activate(test.key);
    
    const success = result.success === test.shouldPass;
    
    if (success) {
      console.log(`✅ 通过 - ${result.success ? '激活成功' : result.error}`);
      passed++;
    } else {
      console.log(`❌ 失败 - 预期 ${test.shouldPass ? '成功' : '失败'}，实际 ${result.success ? '成功' : '失败'}`);
      console.log(`   错误信息：${result.error || '无'}`);
      failed++;
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`\n测试结果：`);
  console.log(`✅ 通过：${passed}/${testCases.length}`);
  console.log(`❌ 失败：${failed}/${testCases.length}`);
  
  if (failed === 0) {
    console.log('\n🎉 所有测试通过！许可证激活功能正常工作。');
  } else {
    console.log('\n⚠️  部分测试失败，请检查代码。');
  }

  // 清理测试目录
  if (fs.existsSync(testDataDir)) {
    fs.rmSync(testDataDir, { recursive: true, force: true });
  }
})();
