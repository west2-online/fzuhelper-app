'use strict';

/* eslint-disable no-bitwise */

const { Buffer } = require('@craftzdog/react-native-buffer');
const forgeModule = require('node-forge');

const NativeSystem = require('../__harmony__/native-system.harmony');

const forge = forgeModule.default ?? forgeModule;
const CryptoDigestAlgorithm = Object.freeze({
  MD2: 'MD2',
  MD4: 'MD4',
  MD5: 'MD5',
  SHA1: 'SHA-1',
  SHA256: 'SHA-256',
  SHA384: 'SHA-384',
  SHA512: 'SHA-512',
});
const CryptoEncoding = Object.freeze({ BASE64: 'base64', HEX: 'hex' });
const AESKeySize = Object.freeze({
  AES128: 128,
  AES192: 192,
  AES256: 256,
});

const DIGEST_ALGORITHMS = new Set(Object.values(CryptoDigestAlgorithm));
const CRYPTO_ENCODINGS = new Set(Object.values(CryptoEncoding));
const AES_KEY_SIZES = new Set(Object.values(AESKeySize));
const GCM_TAG_LENGTHS = new Set([16, 15, 14, 13, 12, 8, 4]);
const DEFAULT_IV_LENGTH = 12;
const DEFAULT_TAG_LENGTH = 16;

class CryptoError extends TypeError {
  constructor(message) {
    super(`expo-crypto: ${message}`);
    this.code = 'ERR_CRYPTO';
  }
}

function assertByteCount(value, methodName) {
  if (typeof value !== 'number' || Number.isNaN(value) || Math.floor(value) < 0 || Math.floor(value) > 1024) {
    throw new TypeError(`expo-crypto: ${methodName}(${value}) expected a valid number from range 0...1024`);
  }
  return Math.floor(value);
}

function assertAlgorithm(algorithm) {
  if (!DIGEST_ALGORITHMS.has(algorithm)) {
    throw new CryptoError(
      `Invalid algorithm provided. Expected one of: ${Object.keys(CryptoDigestAlgorithm)
        .map(key => `CryptoDigestAlgorithm.${key}`)
        .join(', ')}`,
    );
  }
}

function assertEncoding(encoding) {
  if (!CRYPTO_ENCODINGS.has(encoding)) {
    throw new CryptoError(
      `Invalid encoding provided. Expected one of: ${Object.keys(CryptoEncoding)
        .map(key => `CryptoEncoding.${key}`)
        .join(', ')}`,
    );
  }
}

function isIntegerTypedArray(value) {
  const constructors = [
    Int8Array,
    Uint8Array,
    Uint8ClampedArray,
    Int16Array,
    Uint16Array,
    Int32Array,
    Uint32Array,
    typeof BigInt64Array === 'undefined' ? null : BigInt64Array,
    typeof BigUint64Array === 'undefined' ? null : BigUint64Array,
  ].filter(Boolean);
  return constructors.some(TypedArray => value instanceof TypedArray);
}

function getRandomBytes(byteCount) {
  const validByteCount = assertByteCount(byteCount, 'getRandomBytes');
  return Uint8Array.from(NativeSystem.getRandomBytes(validByteCount));
}

async function getRandomBytesAsync(byteCount) {
  const validByteCount = assertByteCount(byteCount, 'getRandomBytesAsync');
  return Uint8Array.from(NativeSystem.getRandomBytes(validByteCount));
}

function getRandomValues(typedArray) {
  if (!isIntegerTypedArray(typedArray)) {
    throw new TypeError('expo-crypto: getRandomValues expected an integer TypedArray');
  }

  const target = new Uint8Array(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength);
  for (let offset = 0; offset < target.byteLength; offset += 1024) {
    const length = Math.min(1024, target.byteLength - offset);
    target.set(NativeSystem.getRandomBytes(length), offset);
  }
  return typedArray;
}

function randomUUID() {
  const bytes = getRandomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

async function digestStringAsync(algorithm, data, options = { encoding: CryptoEncoding.HEX }) {
  assertAlgorithm(algorithm);
  if (typeof data !== 'string') {
    throw new CryptoError('Invalid data provided. Expected a string.');
  }
  const encoding = options?.encoding ?? CryptoEncoding.HEX;
  assertEncoding(encoding);
  return NativeSystem.digestString(algorithm, data, encoding);
}

function bufferSourceBytes(value, methodName) {
  if (value instanceof ArrayBuffer) {
    return new Uint8Array(value);
  }
  if (ArrayBuffer.isView(value)) {
    return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  }
  throw new CryptoError(`${methodName} expected an ArrayBuffer or ArrayBufferView.`);
}

async function digest(algorithm, data) {
  assertAlgorithm(algorithm);
  const bytes = bufferSourceBytes(data, 'digest');
  const result = await NativeSystem.digestBytes(algorithm, Array.from(bytes));
  return Uint8Array.from(result).buffer;
}

function decodeBase64(value, name) {
  if (typeof value !== 'string') {
    throw new CryptoError(`${name} must be a base64-encoded string.`);
  }
  const normalized = value.replace(/[\t\n\f\r ]/gu, '');
  if (
    normalized.length % 4 === 1 ||
    !/^[A-Za-z0-9+/]*={0,2}$/u.test(normalized) ||
    (normalized.includes('=') && normalized.length % 4 !== 0)
  ) {
    throw new CryptoError(`${name} must be a valid base64-encoded string.`);
  }
  return Uint8Array.from(Buffer.from(normalized, 'base64'));
}

function decodeHex(value, name) {
  if (typeof value !== 'string' || value.length % 2 !== 0 || !/^[\da-f]*$/i.test(value)) {
    throw new CryptoError(`${name} must be a valid hexadecimal string.`);
  }
  return Uint8Array.from(Buffer.from(value, 'hex'));
}

function binaryInputBytes(input, name) {
  if (typeof input === 'string') {
    return decodeBase64(input, name);
  }
  if (input instanceof Uint8Array) {
    return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  }
  if (input instanceof ArrayBuffer) {
    return new Uint8Array(input);
  }
  throw new CryptoError(`${name} must be a base64 string, Uint8Array, or ArrayBuffer.`);
}

function copyBytes(bytes) {
  return Uint8Array.from(bytes);
}

function bytesToBase64(bytes) {
  return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString('base64');
}

function bytesToHex(bytes) {
  return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString('hex');
}

function bytesToBinary(bytes) {
  return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString('binary');
}

function binaryToBytes(binary) {
  return Uint8Array.from(Buffer.from(binary, 'binary'));
}

function assertAESKeySize(size) {
  if (!AES_KEY_SIZES.has(size)) {
    throw new CryptoError('AES key size must be 128, 192, or 256 bits.');
  }
}

function assertTagLength(tagLength) {
  if (!GCM_TAG_LENGTHS.has(tagLength)) {
    throw new CryptoError('AES-GCM tag length must be 16, 15, 14, 13, 12, 8, or 4 bytes.');
  }
}

function assertPositiveLength(length, name) {
  if (!Number.isSafeInteger(length) || length <= 0) {
    throw new CryptoError(`${name} must be a positive integer.`);
  }
}

function encodeResult(bytes, encoding, name) {
  if (encoding == null || encoding === 'bytes') {
    return copyBytes(bytes);
  }
  if (encoding === 'base64') {
    return bytesToBase64(bytes);
  }
  throw new CryptoError(`${name} encoding must be "bytes" or "base64".`);
}

class AESEncryptionKey {
  constructor(bytes) {
    this._bytes = copyBytes(bytes);
    this._size = this._bytes.byteLength * 8;
    assertAESKeySize(this._size);
  }

  static async generate(size = AESKeySize.AES256) {
    assertAESKeySize(size);
    return new AESEncryptionKey(getRandomBytes(size / 8));
  }

  static async import(input, encoding) {
    let bytes;
    if (typeof input === 'string') {
      if (encoding == null || encoding === 'hex') {
        bytes = decodeHex(input, 'AES key');
      } else if (encoding === 'base64') {
        bytes = decodeBase64(input, 'AES key');
      } else {
        throw new CryptoError('AES key encoding must be "hex" or "base64".');
      }
    } else if (input instanceof Uint8Array) {
      bytes = input;
    } else {
      throw new CryptoError('AES key must be a Uint8Array, hex string, or base64 string.');
    }
    return new AESEncryptionKey(bytes);
  }

  get size() {
    return this._size;
  }

  async bytes() {
    return copyBytes(this._bytes);
  }

  async encoded(encoding) {
    if (encoding === 'hex') {
      return bytesToHex(this._bytes);
    }
    if (encoding === 'base64') {
      return bytesToBase64(this._bytes);
    }
    throw new CryptoError('AES key encoding must be "hex" or "base64".');
  }
}

class AESSealedData {
  constructor(combined, config) {
    this._combined = copyBytes(combined);
    this._ivLength = config.ivLength;
    this._tagLength = config.tagLength;
    assertPositiveLength(this._ivLength, 'AES-GCM IV length');
    assertTagLength(this._tagLength);
    if (this._combined.byteLength < this._ivLength + this._tagLength) {
      throw new CryptoError('AES sealed data is shorter than its IV and authentication tag.');
    }
  }

  static fromCombined(combined, config = {}) {
    return new AESSealedData(binaryInputBytes(combined, 'AES sealed data'), {
      ivLength: config.ivLength ?? DEFAULT_IV_LENGTH,
      tagLength: config.tagLength ?? DEFAULT_TAG_LENGTH,
    });
  }

  static fromParts(iv, ciphertext, tag = DEFAULT_TAG_LENGTH) {
    const ivBytes = binaryInputBytes(iv, 'AES IV');
    const ciphertextBytes = binaryInputBytes(ciphertext, 'AES ciphertext');
    let tagBytes;
    let tagLength;

    if (typeof tag === 'number') {
      tagLength = tag;
      assertTagLength(tagLength);
      if (ciphertextBytes.byteLength < tagLength) {
        throw new CryptoError('AES ciphertext with tag is shorter than the tag length.');
      }
      tagBytes = new Uint8Array(0);
    } else {
      tagBytes = binaryInputBytes(tag, 'AES authentication tag');
      tagLength = tagBytes.byteLength;
      assertTagLength(tagLength);
    }

    const combined = new Uint8Array(ivBytes.byteLength + ciphertextBytes.byteLength + tagBytes.byteLength);
    combined.set(ivBytes);
    combined.set(ciphertextBytes, ivBytes.byteLength);
    combined.set(tagBytes, ivBytes.byteLength + ciphertextBytes.byteLength);
    return new AESSealedData(combined, {
      ivLength: ivBytes.byteLength,
      tagLength,
    });
  }

  get ivSize() {
    return this._ivLength;
  }

  get tagSize() {
    return this._tagLength;
  }

  get combinedSize() {
    return this._combined.byteLength;
  }

  async iv(encoding = 'bytes') {
    return encodeResult(this._combined.subarray(0, this.ivSize), encoding, 'AES IV');
  }

  async tag(encoding = 'bytes') {
    return encodeResult(this._combined.subarray(this.combinedSize - this.tagSize), encoding, 'AES authentication tag');
  }

  async combined(encoding = 'bytes') {
    return encodeResult(this._combined, encoding, 'AES sealed data');
  }

  async ciphertext(options = {}) {
    const includeTag = options.includeTag ?? false;
    const end = includeTag ? this.combinedSize : this.combinedSize - this.tagSize;
    return encodeResult(this._combined.subarray(this.ivSize, end), options.encoding ?? 'bytes', 'AES ciphertext');
  }
}

function assertEncryptionKey(key) {
  if (!(key instanceof AESEncryptionKey)) {
    throw new CryptoError('Expected an AESEncryptionKey.');
  }
}

function assertSealedData(sealedData) {
  if (!(sealedData instanceof AESSealedData)) {
    throw new CryptoError('Expected an AESSealedData instance.');
  }
}

async function aesEncryptAsync(plaintext, key, options = {}) {
  assertEncryptionKey(key);
  const plaintextBytes = binaryInputBytes(plaintext, 'AES plaintext');
  const tagLength = options.tagLength ?? DEFAULT_TAG_LENGTH;
  assertTagLength(tagLength);

  let iv;
  if (options.nonce == null) {
    iv = getRandomBytes(DEFAULT_IV_LENGTH);
  } else if (Object.prototype.hasOwnProperty.call(options.nonce, 'bytes')) {
    iv = binaryInputBytes(options.nonce.bytes, 'AES nonce');
    assertPositiveLength(iv.byteLength, 'AES-GCM IV length');
  } else if (Object.prototype.hasOwnProperty.call(options.nonce, 'length')) {
    assertPositiveLength(options.nonce.length, 'AES-GCM IV length');
    iv = getRandomBytes(options.nonce.length);
  } else {
    throw new CryptoError('AES nonce must specify either "bytes" or "length".');
  }

  const additionalData =
    options.additionalData == null ? undefined : binaryInputBytes(options.additionalData, 'AES additional data');
  const cipher = forge.cipher.createCipher('AES-GCM', bytesToBinary(key._bytes));
  const startOptions = {
    iv: bytesToBinary(iv),
    tagLength: tagLength * 8,
  };
  if (additionalData != null) {
    startOptions.additionalData = bytesToBinary(additionalData);
  }
  cipher.start(startOptions);
  cipher.update(forge.util.createBuffer(bytesToBinary(plaintextBytes), 'raw'));
  if (!cipher.finish()) {
    throw new CryptoError('AES-GCM encryption failed.');
  }

  const ciphertext = binaryToBytes(cipher.output.getBytes());
  const tag = binaryToBytes(cipher.mode.tag.getBytes());
  return AESSealedData.fromParts(iv, ciphertext, tag);
}

async function aesDecryptAsync(sealedData, key, options = {}) {
  assertSealedData(sealedData);
  assertEncryptionKey(key);
  const additionalData =
    options.additionalData == null ? undefined : binaryInputBytes(options.additionalData, 'AES additional data');
  const iv = sealedData._combined.subarray(0, sealedData.ivSize);
  const ciphertext = sealedData._combined.subarray(sealedData.ivSize, sealedData.combinedSize - sealedData.tagSize);
  const tag = sealedData._combined.subarray(sealedData.combinedSize - sealedData.tagSize);
  const decipher = forge.cipher.createDecipher('AES-GCM', bytesToBinary(key._bytes));
  const startOptions = {
    iv: bytesToBinary(iv),
    tag: forge.util.createBuffer(bytesToBinary(tag), 'raw'),
    tagLength: sealedData.tagSize * 8,
  };
  if (additionalData != null) {
    startOptions.additionalData = bytesToBinary(additionalData);
  }
  decipher.start(startOptions);
  decipher.update(forge.util.createBuffer(bytesToBinary(ciphertext), 'raw'));
  if (!decipher.finish()) {
    throw new CryptoError('AES-GCM authentication failed.');
  }

  const plaintext = binaryToBytes(decipher.output.getBytes());
  const output = options.output ?? 'bytes';
  if (output === 'base64') {
    return bytesToBase64(plaintext);
  }
  if (output === 'bytes') {
    return plaintext;
  }
  throw new CryptoError('AES decryption output must be "bytes" or "base64".');
}

module.exports = {
  AESKeySize,
  AESEncryptionKey,
  AESSealedData,
  CryptoDigestAlgorithm,
  CryptoEncoding,
  aesDecryptAsync,
  aesEncryptAsync,
  digest,
  digestStringAsync,
  getRandomBytes,
  getRandomBytesAsync,
  getRandomValues,
  randomUUID,
};
