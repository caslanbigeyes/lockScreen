#!/usr/bin/env node
// 简化版许可证生成工具 - 直接显示密钥，方便复制

const crypto = require('crypto');
const fs = require('fs');

function generateLicense() {
  return crypto.randomBytes(8)
    .toString('hex')
    .toUpperCase()
    .match(/.{1,4}/g)
    .join('-');
}

const count = parseInt(process.argv[2]) || 1;

console.log('\n🔑 FocusGuard Pro 许可证密钥\n');
console.log('═'.repeat(50));

const licenses = [];
for (let i = 1; i <= count; i++) {
  const key = generateLicense();
  licenses.push(key);
  console.log(`${i.toString().padStart(2, '0')}. ${key}`);
}

console.log('═'.repeat(50));
console.log(`\n✅ 已生成 ${count} 个密钥\n`);

// 询问是否保存
console.log('💾 密钥已保存到：licenses.txt');
console.log('📋 直接复制上面的密钥发送给买家即可\n');

// 保存到固定文件名
const content = licenses.map((key, i) => `${(i + 1).toString().padStart(2, '0')}. ${key}`).join('\n');
fs.writeFileSync('licenses.txt', content, 'utf-8');
