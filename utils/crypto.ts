import { Buffer } from 'buffer';
import CryptoJS from 'crypto-js';
import * as Crypto from 'expo-crypto';

export async function md5(text: string, bit: 16 | 32) {
  // DOMException: Failed to execute 'digest' on 'SubtleCrypto': Algorithm: Unrecognized name
  //     at Object.digestStringAsync
  // const digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.MD5, text);

  const digest = CryptoJS.MD5(text).toString();

  if (bit === 16) {
    return digest.substring(8, 24); // return 16-bit hash (substring from index 8 to 24)
  }

  return digest; // return full 32-bit hash
}

export function base64(text: string) {
  return Buffer.from(text).toString('base64');
}

export const randomUUID = Crypto.randomUUID;
