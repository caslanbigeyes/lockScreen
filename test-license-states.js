#!/usr/bin/env node
// 测试许可证状态的辅助脚本

const fs = require('fs');
const path = require('path');
const { app } = require('electron');

// 获取用户数据目录
const getUserDataPath = () => {
  const platform = process.platform;
  const home = process.env.HOME || process.env.USERPROFILE;
  
  if (platform === 'darwin') {
    return path.join(home, 'Library', 'Application Support', 'lockscreen-focus');
  } else if (platform === 'win32') {
    return path.join(process.env.APPDATA, 'lockscreen-focus');
  } else {
    return path.join(home, '.config', 'lockscreen-focus');
  }
};

const licenseFile = path.join(getUserDataPath(), 'license.json');

// 辅助函数：计算时间戳
const daysAgo = (days) => Date.now() - (days * 24 * 60 * 60 * 1000);

// 测试场景
const scenarios = {
  'new-user': {
    name: '新用户（试用期 7 天）',
    data: {
      key: "",
      instanceId: "",
      firstLaunchAt: Date.now(),
      status: "trial",
      lastValidatedAt: 0,
      lastValidationResult: null
    }
  },
  'trial-6-days': {
    name: '试用期第 6 天（剩余 1 天）',
    data: {
      key: "",
      instanceId: "",
      firstLaunchAt: daysAgo(6),
      status: "trial",
      lastValidatedAt: 0,
      lastValidationResult: null
    }
  },
  'trial-expired': {
    name: '试用期已过期',
    data: {
      key: "",
      instanceId: "",
      firstLaunchAt: daysAgo(8),
      status: "expired",
      lastValidatedAt: 0,
      lastValidationResult: null
    }
  },
  'pro-active': {
    name: 'Pro 已激活（模拟）',
    data: {
      key: "TEST-KEY-1234-5678",
      instanceId: "test-instance-id",
      firstLaunchAt: daysAgo(10),
      status: "active",
      lastValidatedAt: Date.now(),
      lastValidationResult: true
    }
  },
  'pro-cache-expired': {
    name: 'Pro 激活但缓存过期（需要重新验证）',
    data: {
      key: "TEST-KEY-1234-5678",
      instanceId: "test-instance-id",
      firstLaunchAt: daysAgo(10),
      status: "active",
      lastValidatedAt: daysAgo(8),
      lastValidationResult: true
    }
  }
};

// 主函数
const main = () => {
  const args = process.argv.slice(2);
  const scenario = args[0];

  if (!scenario || !scenarios[scenario]) {
    console.log('FocusGuard 许可证状态测试工具\n');
    console.log('用法: node test-license-states.js <scenario>\n');
    console.log('可用场景:');
    Object.keys(scenarios).forEach(key => {
      console.log(`  ${key.padEnd(20)} - ${scenarios[key].name}`);
    });
    console.log('\n示例:');
    console.log('  node test-license-states.js new-user');
    console.log('  node test-license-states.js trial-expired');
    console.log('  node test-license-states.js pro-active');
    console.log('\n许可证文件位置:');
    console.log(`  ${licenseFile}`);
    process.exit(0);
  }

  const config = scenarios[scenario];
  
  // 确保目录存在
  const dir = path.dirname(licenseFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // 写入测试数据
  fs.writeFileSync(licenseFile, JSON.stringify(config.data, null, 2), 'utf-8');
  
  console.log(`✓ 已设置测试场景: ${config.name}`);
  console.log(`✓ 许可证文件: ${licenseFile}`);
  console.log('\n测试数据:');
  console.log(JSON.stringify(config.data, null, 2));
  console.log('\n现在可以启动应用进行测试: npm start');
};

main();
