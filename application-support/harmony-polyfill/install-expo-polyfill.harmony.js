'use strict';

const NativeSystem = require('./native-system.harmony');
const cryptoObject = globalThis.crypto ?? {};

if (typeof cryptoObject.getRandomValues !== 'function') {
  cryptoObject.getRandomValues = array => {
    const integerTypedArrays = [
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
    if (!integerTypedArrays.some(TypedArray => array instanceof TypedArray)) {
      throw new TypeError('getRandomValues expects an integer TypedArray');
    }
    if (array.byteLength > 65536) {
      const error = new Error(
        `The requested length (${array.byteLength} bytes) exceeds the 65536-byte Web Crypto limit`,
      );
      error.name = 'QuotaExceededError';
      throw error;
    }

    const target = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
    for (let offset = 0; offset < target.byteLength; offset += 1024) {
      const length = Math.min(1024, target.byteLength - offset);
      target.set(NativeSystem.getRandomBytes(length), offset);
    }
    return array;
  };
}

globalThis.crypto = cryptoObject;
