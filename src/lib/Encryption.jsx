import CryptoJS from 'crypto-js';

export const generateKey1 = (userUID, otherUserUID) => {
  return CryptoJS.MD5(userUID + otherUserUID).toString(CryptoJS.enc.Base64);
};

export const generateKey2 = (otherUserUID, userUID) => {
  return CryptoJS.MD5(otherUserUID + userUID).toString(CryptoJS.enc.Base64);
};

// Generate a key for group messages based on groupId and createdAt timestamp
export const generateGroupKey = (groupId, createdAt) => {
  return CryptoJS.MD5(groupId + createdAt).toString(CryptoJS.enc.Base64);
};

export const encryptWithKey1 = (text, key1) => {
  return CryptoJS.AES.encrypt(text, key1).toString();
};

export const encryptWithKey2 = (text, key2) => {
  return CryptoJS.AES.encrypt(text, key2).toString();
};

// Encrypt a message with the group key
export const encryptWithGroupKey = (text, groupKey) => {
  return CryptoJS.AES.encrypt(text, groupKey).toString();
};

// Decrypt a message with the group key
export const decryptWithGroupKey = (encryptedText, groupKey) => {
  const bytes = CryptoJS.AES.decrypt(encryptedText, groupKey);
  return bytes.toString(CryptoJS.enc.Utf8);
};

export const decryptWithKey1 = (encryptedText, key1) => {
  const bytes = CryptoJS.AES.decrypt(encryptedText, key1);
  return bytes.toString(CryptoJS.enc.Utf8);
};

export const decryptWithKey2 = (encryptedText, key2) => {
  const bytes = CryptoJS.AES.decrypt(encryptedText, key2);
  return bytes.toString(CryptoJS.enc.Utf8);
};
