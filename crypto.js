// crypto.js — 照片 AES-256-CBC 加密模块
// 使用 Node.js 内置 crypto，密钥从许可证 key 用 PBKDF2 派生

const crypto = require("crypto");

const ALGORITHM = "aes-256-cbc";
const SALT = "focusguard-photo-salt";
const ITERATIONS = 100000;
const KEY_LENGTH = 32;
const IV_LENGTH = 16;

/**
 * 从许可证 key 派生加密密钥
 */
const deriveKey = (licenseKey) => {
  if (!licenseKey) {
    // 无许可证时使用默认密钥（仍加密，但可恢复）
    licenseKey = "default-focus-guard-key";
  }
  return crypto.pbkdf2Sync(licenseKey, SALT, ITERATIONS, KEY_LENGTH, "sha256");
};

/**
 * 加密 Buffer
 * 返回格式：IV(16 bytes) + encrypted data
 */
const encrypt = (buffer, licenseKey) => {
  const key = deriveKey(licenseKey);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  // 前 16 字节为 IV，后续为密文
  return Buffer.concat([iv, encrypted]);
};

/**
 * 解密 Buffer
 * 输入格式：IV(16 bytes) + encrypted data
 */
const decrypt = (encryptedBuffer, licenseKey) => {
  const key = deriveKey(licenseKey);
  const iv = encryptedBuffer.subarray(0, IV_LENGTH);
  const data = encryptedBuffer.subarray(IV_LENGTH);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  return Buffer.concat([decipher.update(data), decipher.final()]);
};

module.exports = { encrypt, decrypt };
