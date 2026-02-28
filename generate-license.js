#!/usr/bin/env node
// 许可证密钥生成工具

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// 生成单个许可证密钥
function generateLicense() {
  return crypto.randomBytes(8)
    .toString('hex')
    .toUpperCase()
    .match(/.{1,4}/g)
    .join('-');
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  const count = parseInt(args[0]) || 1;

  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║   FocusGuard 许可证密钥生成工具            ║');
  console.log('╚════════════════════════════════════════════╝\n');

  const licenses = [];
  
  for (let i = 1; i <= count; i++) {
    const key = generateLicense();
    licenses.push(key);
    console.log(`${i.toString().padStart(2, '0')}. ${key}`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 保存到文件
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `licenses-${timestamp}.txt`;
  const filepath = path.join(__dirname, filename);

  const content = [
    'FocusGuard Pro 许可证密钥',
    `生成时间：${new Date().toLocaleString('zh-CN')}`,
    `数量：${count}`,
    '',
    '密钥列表：',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    ...licenses.map((key, i) => `${(i + 1).toString().padStart(2, '0')}. ${key}`),
    '',
    '使用说明：',
    '1. 复制密钥发送给买家',
    '2. 买家在应用中激活',
    '3. 记录已使用的密钥',
    '',
    '注意事项：',
    '- 每个密钥只能激活一次',
    '- 请妥善保管密钥',
    '- 不要公开分享',
  ].join('\n');

  fs.writeFileSync(filepath, content, 'utf-8');

  console.log(`✅ 已保存到文件：${filename}\n`);
  console.log('💡 使用方法：');
  console.log('   1. 复制密钥发送给买家');
  console.log('   2. 买家在应用"设置"页面激活');
  console.log('   3. 记录已使用的密钥\n');
  console.log('📝 生成更多密钥：');
  console.log(`   node generate-license.js 10  # 生成 10 个\n`);
}

main();
