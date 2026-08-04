'use strict';

const HarmonyCookieModule = require('@react-native-ohos/cookies');

const HarmonyCookieManager = HarmonyCookieModule.default ?? HarmonyCookieModule;

function normalizeCookieUrl(url) {
  try {
    const parsed = new URL(url);
    // Cookies are scoped to hosts, not ports. The Harmony package otherwise
    // emits an invalid Domain for endpoints such as jwcjwxt2.fzu.edu.cn:81.
    parsed.port = '';
    return parsed.toString();
  } catch {
    return url;
  }
}

function unsupported(method) {
  const error = new Error(`CookieManager.${method} is not supported by the HarmonyOS cookie store`);
  error.code = 'not_supported';
  return Promise.reject(error);
}

function invalidCookie(message) {
  const error = new Error(message);
  error.code = 'invalid_cookie';
  throw error;
}

function parseSetCookieHeader(header) {
  if (typeof header !== 'string' || header.trim() === '') {
    invalidCookie('CookieManager.setFromResponse requires a non-empty cookie string');
  }

  const parts = header.split(';');
  const nameValue = parts.shift().trim();
  const separator = nameValue.indexOf('=');
  if (separator <= 0) {
    invalidCookie('The Set-Cookie header must begin with a cookie name and value');
  }

  const cookie = {
    name: nameValue.slice(0, separator).trim(),
    value: nameValue.slice(separator + 1).trim(),
  };

  if (!cookie.name) {
    invalidCookie('The Set-Cookie header contains an empty cookie name');
  }

  for (const rawAttribute of parts) {
    const attribute = rawAttribute.trim();
    if (!attribute) continue;

    const attributeSeparator = attribute.indexOf('=');
    const rawName = attributeSeparator === -1 ? attribute : attribute.slice(0, attributeSeparator);
    const rawValue = attributeSeparator === -1 ? '' : attribute.slice(attributeSeparator + 1).trim();

    switch (rawName.trim().toLowerCase()) {
      case 'domain':
        if (rawValue) cookie.domain = rawValue;
        break;
      case 'path':
        if (rawValue) cookie.path = rawValue;
        break;
      case 'expires': {
        const expires = new Date(rawValue);
        if (!Number.isNaN(expires.getTime())) {
          cookie.expires = expires.toUTCString();
        }
        break;
      }
      case 'max-age': {
        const seconds = Number(rawValue);
        if (Number.isFinite(seconds)) {
          cookie.expires = new Date(seconds <= 0 ? 0 : Date.now() + seconds * 1000).toUTCString();
        }
        break;
      }
      case 'version':
        if (rawValue) cookie.version = rawValue;
        break;
      case 'secure':
        cookie.secure = true;
        break;
      case 'httponly':
        cookie.httpOnly = true;
        break;
      default:
        // The HarmonyOS cookie API cannot represent SameSite, Priority, Partitioned,
        // and other extension attributes. Unknown attributes do not affect the
        // name/value pair, matching browser Set-Cookie parsing.
        break;
    }
  }

  return cookie;
}

const CookieManager = {
  getAll() {
    return unsupported('getAll');
  },

  clearAll(useWebKit = false) {
    return HarmonyCookieManager.clearAll(useWebKit);
  },

  get(url, useWebKit = false) {
    return HarmonyCookieManager.get(url, useWebKit);
  },

  set(url, cookie, useWebKit = false) {
    return HarmonyCookieManager.set(normalizeCookieUrl(url), cookie, useWebKit);
  },

  clearByName(url, name, useWebKit = false) {
    return HarmonyCookieManager.clearByName(normalizeCookieUrl(url), name, useWebKit);
  },

  async flush() {
    return unsupported('flush');
  },

  removeSessionCookies() {
    return HarmonyCookieManager.removeSessionCookies();
  },

  async setFromResponse(url, header) {
    if (typeof url !== 'string' || url.trim() === '') {
      invalidCookie('CookieManager.setFromResponse requires a non-empty URL');
    }

    const wasSet = await HarmonyCookieManager.set(normalizeCookieUrl(url), parseSetCookieHeader(header), false);
    if (!wasSet) {
      const error = new Error('HarmonyOS failed to store the Set-Cookie header');
      error.code = 'cookie_set_error';
      throw error;
    }
    return true;
  },

  getFromResponse() {
    return unsupported('getFromResponse');
  },
};

module.exports = CookieManager;
module.exports.default = CookieManager;
