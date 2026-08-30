'use strict';

const STANDARD_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const URL_SAFE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const PAD = '=';

function buildReverseMap(alphabet) {
  const map = new Int8Array(256).fill(-1);
  for (let i = 0; i < alphabet.length; i++) {
    map[alphabet.charCodeAt(i)] = i;
  }
  return map;
}

const DECODE_MAP_STANDARD = buildReverseMap(STANDARD_ALPHABET);
DECODE_MAP_STANDARD['-'.charCodeAt(0)] = 62;
DECODE_MAP_STANDARD['_'.charCodeAt(0)] = 63;

function bytesFromArrayBufferLike(value) {
  if (value instanceof ArrayBuffer) {
    return new Uint8Array(value);
  }
  if (ArrayBuffer.isView(value) && value.buffer instanceof ArrayBuffer) {
    return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  }
  return null;
}

function encodeBytes(bytes, alphabet, urlSafe) {
  const len = bytes.length;
  // 每 3 字节产出 4 字符；不足 3 字节时标准模式补 '='。
  const fullGroups = Math.floor(len / 3);
  const remainder = len - fullGroups * 3;
  const outputLength = urlSafe
    ? // url-safe 不补 '='：满组 + 余数按 ceil(remainder*4/3)
      fullGroups * 4 + (remainder === 0 ? 0 : remainder + 1)
    : Math.ceil(len / 3) * 4;

  const output = new Array(outputLength);
  let outIdx = 0;
  let i = 0;

  while (i + 3 <= len) {
    const b0 = bytes[i];
    const b1 = bytes[i + 1];
    const b2 = bytes[i + 2];
    output[outIdx++] = alphabet[b0 >> 2];
    output[outIdx++] = alphabet[((b0 & 0x03) << 4) | (b1 >> 4)];
    output[outIdx++] = alphabet[((b1 & 0x0f) << 2) | (b2 >> 6)];
    output[outIdx++] = alphabet[b2 & 0x3f];
    i += 3;
  }

  if (remainder === 1) {
    const b0 = bytes[i];
    output[outIdx++] = alphabet[b0 >> 2];
    output[outIdx++] = alphabet[(b0 & 0x03) << 4];
    if (!urlSafe) {
      output[outIdx++] = PAD;
      output[outIdx++] = PAD;
    }
  } else if (remainder === 2) {
    const b0 = bytes[i];
    const b1 = bytes[i + 1];
    output[outIdx++] = alphabet[b0 >> 2];
    output[outIdx++] = alphabet[((b0 & 0x03) << 4) | (b1 >> 4)];
    output[outIdx++] = alphabet[(b1 & 0x0f) << 2];
    if (!urlSafe) {
      output[outIdx++] = PAD;
    }
  }

  return output.join('');
}

function decodeToBytes(base64, removeLinebreaks, decodeMap) {
  if (typeof base64 !== 'string') {
    // 与原生 C++ 行为一致：非字符串入参返回 -1（而非抛错）。
    return -1;
  }

  let input = base64;
  if (removeLinebreaks) {
    input = input.replace(/\n/g, '');
  }

  // 先把有效字符（含 pad）收集出来，跳过空白，容错 url-safe 缺失填充。
  // 这与 C++ base64_decode 逐字符扫描的行为一致，不会因长度非 4 倍数而抛错。
  const padCode = PAD.charCodeAt(0);
  const codes = [];
  let padCount = 0;
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    if (code === padCode) {
      padCount++;
      codes.push(-1); // 记录填充位置（只在尾部出现）
      continue;
    }
    // 跳过空白字符（空格/制表符/回车等），提升对格式化 base64 的鲁棒性。
    if (code === 32 || code === 9 || code === 13) {
      continue;
    }
    const v = decodeMap[code];
    if (v < 0) {
      throw new Error('Invalid base64 character');
    }
    codes.push(v);
  }

  const validLen = codes.length - padCount;
  if (validLen % 4 === 1) {
    // 1 个残余 sextet 无法产出任何完整字节，属于非法输入。
    throw new Error('Invalid base64 input');
  }

  const byteLength = Math.floor(validLen / 4) * 3 + (validLen % 4 === 0 ? 0 : (validLen % 4) - 1);
  const out = new Uint8Array(byteLength);
  let outIdx = 0;

  // 每 4 个有效 sextet 产出 3 字节；末尾不足 4 个时按余数产出 1 或 2 字节。
  let i = 0;
  while (i + 4 <= validLen) {
    const s0 = codes[i];
    const s1 = codes[i + 1];
    const s2 = codes[i + 2];
    const s3 = codes[i + 3];
    out[outIdx++] = (s0 << 2) | (s1 >> 4);
    out[outIdx++] = ((s1 & 0x0f) << 4) | (s2 >> 2);
    out[outIdx++] = ((s2 & 0x03) << 6) | s3;
    i += 4;
  }

  const remainder = validLen - i;
  if (remainder === 2) {
    const s0 = codes[i];
    const s1 = codes[i + 1];
    out[outIdx++] = (s0 << 2) | (s1 >> 4);
  } else if (remainder === 3) {
    const s0 = codes[i];
    const s1 = codes[i + 1];
    const s2 = codes[i + 2];
    out[outIdx++] = (s0 << 2) | (s1 >> 4);
    out[outIdx++] = ((s1 & 0x0f) << 4) | (s2 >> 2);
  }

  return out;
}

function installQuickBase64() {
  if (typeof globalThis.base64FromArrayBuffer !== 'function') {
    globalThis.base64FromArrayBuffer = (value, urlSafe) => {
      const alphabet = urlSafe ? URL_SAFE_ALPHABET : STANDARD_ALPHABET;
      const bytes = bytesFromArrayBufferLike(value);
      if (bytes !== null) {
        return encodeBytes(bytes, alphabet, !!urlSafe);
      }
      if (typeof value === 'string') {
        // 字符串按 UTF-8 字节编码，与原生 valueToString 对 string 的处理一致
        // （utf8(util) 对 BMP 字符即 charCodeAt）。
        const utf8 = [];
        for (let i = 0; i < value.length; i++) {
          let c = value.charCodeAt(i);
          if (c < 0x80) {
            utf8.push(c);
          } else if (c < 0x800) {
            utf8.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
          } else {
            utf8.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
          }
        }
        return encodeBytes(utf8, alphabet, !!urlSafe);
      }
      // 既非 ArrayBuffer 也非 string：与原生一致返回 -1。
      return -1;
    };
  }

  if (typeof globalThis.base64ToArrayBuffer !== 'function') {
    globalThis.base64ToArrayBuffer = (base64, removeLinebreaks) => {
      const decoded = decodeToBytes(base64, !!removeLinebreaks, DECODE_MAP_STANDARD);
      if (decoded === -1) {
        return -1;
      }
      // 返回精确长度的新 ArrayBuffer（拷贝出独立缓冲，避免共享 Uint8Array 的 buffer）。
      const buffer = new ArrayBuffer(decoded.byteLength);
      new Uint8Array(buffer).set(decoded);
      return buffer;
    };
  }
}

installQuickBase64();

module.exports = { installQuickBase64 };
