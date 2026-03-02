// test-build-config.js - 测试打包配置

const fs = require('fs');
const path = require('path');

console.log('╔════════════════════════════════════════════╗');
console.log('║   FocusGuard 打包配置检查                  ║');
console.log('╚════════════════════════════════════════════╝\n');

let passed = 0;
let failed = 0;

// 检查 package.json
console.log('检查 package.json...');
try {
  const pkg = require('./package.json');
  
  // 检查必需字段
  const requiredFields = ['name', 'version', 'main', 'build'];
  requiredFields.forEach(field => {
    if (pkg[field]) {
      console.log(`  ✅ ${field}: ${typeof pkg[field] === 'object' ? 'configured' : pkg[field]}`);
      passed++;
    } else {
      console.log(`  ❌ ${field}: missing`);
      failed++;
    }
  });
  
  // 检查打包脚本
  console.log('\n检查打包脚本...');
  const scripts = ['build', 'build:mac', 'build:win', 'build:all'];
  scripts.forEach(script => {
    if (pkg.scripts && pkg.scripts[script]) {
      console.log(`  ✅ npm run ${script}`);
      passed++;
    } else {
      console.log(`  ❌ npm run ${script}: missing`);
      failed++;
    }
  });
  
  // 检查 electron-builder 配置
  console.log('\n检查 electron-builder 配置...');
  if (pkg.build) {
    const buildConfig = pkg.build;
    
    if (buildConfig.appId) {
      console.log(`  ✅ appId: ${buildConfig.appId}`);
      passed++;
    } else {
      console.log('  ❌ appId: missing');
      failed++;
    }
    
    if (buildConfig.mac) {
      console.log('  ✅ macOS 配置: 已设置');
      passed++;
    } else {
      console.log('  ⚠️  macOS 配置: 未设置');
    }
    
    if (buildConfig.win) {
      console.log('  ✅ Windows 配置: 已设置');
      passed++;
    } else {
      console.log('  ⚠️  Windows 配置: 未设置');
    }
  }
  
} catch (err) {
  console.log(`  ❌ 读取失败: ${err.message}`);
  failed++;
}

// 检查 build 目录
console.log('\n检查 build 目录...');
const buildDir = path.join(__dirname, 'build');
if (fs.existsSync(buildDir)) {
  console.log('  ✅ build/ 目录存在');
  passed++;
  
  // 检查 entitlements 文件
  const entitlements = path.join(buildDir, 'entitlements.mac.plist');
  if (fs.existsSync(entitlements)) {
    console.log('  ✅ entitlements.mac.plist 存在');
    passed++;
  } else {
    console.log('  ❌ entitlements.mac.plist 不存在');
    failed++;
  }
  
  // 检查图标（可选）
  const icns = path.join(buildDir, 'icon.icns');
  const ico = path.join(buildDir, 'icon.ico');
  
  if (fs.existsSync(icns)) {
    console.log('  ✅ icon.icns 存在');
    passed++;
  } else {
    console.log('  ⚠️  icon.icns 不存在（将使用默认图标）');
  }
  
  if (fs.existsSync(ico)) {
    console.log('  ✅ icon.ico 存在');
    passed++;
  } else {
    console.log('  ⚠️  icon.ico 不存在（将使用默认图标）');
  }
} else {
  console.log('  ❌ build/ 目录不存在');
  failed++;
}

// 检查 electron-builder 是否安装
console.log('\n检查依赖...');
try {
  require.resolve('electron-builder');
  console.log('  ✅ electron-builder 已安装');
  passed++;
} catch {
  console.log('  ❌ electron-builder 未安装');
  console.log('     运行: npm install electron-builder --save-dev');
  failed++;
}

try {
  require.resolve('electron');
  console.log('  ✅ electron 已安装');
  passed++;
} catch {
  console.log('  ❌ electron 未安装');
  console.log('     运行: npm install electron');
  failed++;
}

// 检查主文件
console.log('\n检查应用文件...');
const mainFile = path.join(__dirname, 'main.js');
if (fs.existsSync(mainFile)) {
  console.log('  ✅ main.js 存在');
  passed++;
} else {
  console.log('  ❌ main.js 不存在');
  failed++;
}

const indexFile = path.join(__dirname, 'index.html');
if (fs.existsSync(indexFile)) {
  console.log('  ✅ index.html 存在');
  passed++;
} else {
  console.log('  ❌ index.html 不存在');
  failed++;
}

// 总结
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`\n检查结果：`);
console.log(`✅ 通过：${passed}`);
console.log(`❌ 失败：${failed}`);

if (failed === 0) {
  console.log('\n🎉 配置完成！可以开始打包了。');
  console.log('\n运行以下命令打包：');
  console.log('  npm run build:mac   # macOS 版本');
  console.log('  npm run build:win   # Windows 版本');
  console.log('  npm run build:all   # 所有平台');
} else {
  console.log('\n⚠️  请修复上述问题后再打包。');
}

console.log('\n查看详细说明：BUILD_NOW.md');
