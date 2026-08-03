'use strict';

const { Buffer } = require('@craftzdog/react-native-buffer');
const { UnavailabilityError } = require('expo-modules-core');
const { TurboModuleRegistry } = require('react-native');
const ReactNativeBlobUtilModule = require('react-native-blob-util');

const ReactNativeBlobUtil = ReactNativeBlobUtilModule.default ?? ReactNativeBlobUtilModule;
const nativeFs = ReactNativeBlobUtil.fs;
const nativeHarmonyFs = TurboModuleRegistry.getEnforcing('ExpoFileSystemHarmony');

const FileSystemSessionType = Object.freeze({
  BACKGROUND: 0,
  FOREGROUND: 1,
});
const FileSystemUploadType = Object.freeze({
  BINARY_CONTENT: 0,
  MULTIPART: 1,
});
const EncodingType = Object.freeze({
  UTF8: 'utf8',
  Base64: 'base64',
});

function unavailable(method) {
  throw new UnavailabilityError('expo-file-system', method);
}

function toNativePath(uri) {
  if (typeof uri !== 'string' || uri.length === 0) {
    throw new TypeError('expo-file-system: a non-empty file URI is required');
  }
  if (/^[a-z][a-z\d+.-]*:/i.test(uri) && !uri.startsWith('file://')) {
    throw new UnavailabilityError('expo-file-system', `URI scheme used by ${uri}`);
  }
  return uri.replace(/^file:\/\//, '');
}

function toFileUri(filePath) {
  if (!filePath) return null;
  return filePath.startsWith('file://') ? filePath : `file://${filePath}`;
}

function withTrailingSlash(uri) {
  if (!uri) return null;
  return uri.endsWith('/') ? uri : `${uri}/`;
}

function parentPath(filePath) {
  const normalized = filePath.replace(/\/+$/, '');
  const separator = normalized.lastIndexOf('/');
  return separator <= 0 ? '/' : normalized.slice(0, separator);
}

function headerValue(headers, expectedName) {
  const name = Object.keys(headers ?? {}).find(candidate => candidate.toLowerCase() === expectedName.toLowerCase());
  return name ? String(headers[name]) : null;
}

function normalizeHttpResult(response) {
  const info = response.info();
  const headers = info.headers ?? {};
  return {
    headers,
    status: Number(info.status),
    mimeType: headerValue(headers, 'content-type'),
  };
}

const cacheDirectory = withTrailingSlash(toFileUri(nativeFs.dirs.CacheDir));
const documentDirectory = withTrailingSlash(toFileUri(nativeFs.dirs.DocumentDir));
const bundleDirectory = withTrailingSlash(toFileUri(nativeFs.dirs.MainBundleDir));

async function getInfoAsync(uri, options = {}) {
  const filePath = toNativePath(uri);
  if (!(await nativeFs.exists(filePath))) {
    return { exists: false, isDirectory: false, uri };
  }

  const stat = await nativeFs.stat(filePath);
  const lastModified = Number(stat.lastModified);
  const info = {
    exists: true,
    isDirectory: stat.type === 'directory',
    modificationTime: Number.isFinite(lastModified)
      ? lastModified > 10_000_000_000
        ? lastModified / 1000
        : lastModified
      : 0,
    size: Number(stat.size) || 0,
    uri,
  };
  if (options.md5 && !info.isDirectory) {
    info.md5 = await nativeFs.hash(filePath, 'md5');
  }
  return info;
}

async function makeDirectoryAsync(uri, options = {}) {
  const filePath = toNativePath(uri);
  if (await nativeFs.exists(filePath)) {
    if (options.intermediates) return;
    throw new Error(`Directory already exists: ${uri}`);
  }
  if (!options.intermediates && !(await nativeFs.exists(parentPath(filePath)))) {
    throw new Error(`Parent directory does not exist: ${toFileUri(parentPath(filePath))}`);
  }
  await nativeFs.mkdir(filePath);
}

async function readDirectoryAsync(uri) {
  const filePath = toNativePath(uri);
  const stat = await nativeFs.stat(filePath);
  if (stat.type !== 'directory') {
    throw new Error(`Not a directory: ${uri}`);
  }
  return nativeFs.ls(filePath);
}

async function readAsStringAsync(uri, options = {}) {
  const encoding = options.encoding ?? EncodingType.UTF8;
  if (encoding !== EncodingType.UTF8 && encoding !== EncodingType.Base64) {
    throw new TypeError(`Unsupported encoding: ${encoding}`);
  }

  const contents = await nativeFs.readFile(toNativePath(uri), encoding);
  const hasRange = options.position != null || options.length != null;
  if (!hasRange) return contents;
  if (
    encoding !== EncodingType.Base64 ||
    !Number.isSafeInteger(options.position) ||
    options.position < 0 ||
    !Number.isSafeInteger(options.length) ||
    options.length < 0
  ) {
    throw new TypeError(
      'expo-file-system: position and length must be non-negative integers and require base64 encoding',
    );
  }
  const bytes = Buffer.from(contents, 'base64');
  return bytes.subarray(options.position, options.position + options.length).toString('base64');
}

async function writeAsStringAsync(uri, contents, options = {}) {
  if (typeof contents !== 'string') {
    throw new TypeError('expo-file-system: contents must be a string');
  }
  const encoding = options.encoding ?? EncodingType.UTF8;
  if (encoding !== EncodingType.UTF8 && encoding !== EncodingType.Base64) {
    throw new TypeError(`Unsupported encoding: ${encoding}`);
  }
  const filePath = toNativePath(uri);
  if (options.append) {
    await nativeFs.appendFile(filePath, contents, encoding);
  } else {
    await nativeFs.writeFile(filePath, contents, encoding);
  }
}

async function removeRecursively(filePath) {
  const stat = await nativeFs.stat(filePath);
  if (stat.type === 'directory') {
    const entries = await nativeFs.ls(filePath);
    for (const entry of entries) {
      await removeRecursively(`${filePath.replace(/\/+$/, '')}/${entry}`);
    }
    await nativeHarmonyFs.removeDirectory(filePath);
  } else {
    await nativeFs.unlink(filePath);
  }
}

async function deleteAsync(uri, options = {}) {
  const filePath = toNativePath(uri).replace(/\/+$/, '');
  if (!(await nativeFs.exists(filePath))) {
    if (options.idempotent) return;
    throw new Error(`File does not exist: ${uri}`);
  }
  await removeRecursively(filePath);
}

async function copyEntry(fromPath, toPath) {
  const stat = await nativeFs.stat(fromPath);
  if (stat.type !== 'directory') {
    await nativeFs.cp(fromPath, toPath);
    return;
  }
  if (!(await nativeFs.exists(toPath))) {
    await nativeFs.mkdir(toPath);
  }
  const entries = await nativeFs.ls(fromPath);
  for (const entry of entries) {
    await copyEntry(`${fromPath.replace(/\/+$/, '')}/${entry}`, `${toPath.replace(/\/+$/, '')}/${entry}`);
  }
}

async function copyAsync({ from, to }) {
  await copyEntry(toNativePath(from), toNativePath(to));
}

async function moveAsync({ from, to }) {
  const fromPath = toNativePath(from);
  const stat = await nativeFs.stat(fromPath);
  if (stat.type === 'directory') {
    await nativeHarmonyFs.move(fromPath, toNativePath(to));
    return;
  }
  await nativeFs.mv(fromPath, toNativePath(to));
}

async function getFreeDiskStorageAsync() {
  const result = await nativeFs.df();
  return Number(result.free);
}

async function getTotalDiskCapacityAsync() {
  const result = await nativeFs.df();
  return Number(result.total);
}

function createDownloadTask(uri, fileUri, options, callback) {
  const destination = toNativePath(fileUri);
  const task = ReactNativeBlobUtil.config({
    fileCache: true,
    overwrite: true,
    path: destination,
  }).fetch('GET', uri, options.headers ?? {});
  if (callback) {
    task.progress({ interval: 250 }, (written, expected) => {
      callback({
        totalBytesExpectedToWrite: Number(expected),
        totalBytesWritten: Number(written),
      });
    });
  }
  return { destination, task };
}

async function downloadAsync(uri, fileUri, options = {}) {
  const { destination, task } = createDownloadTask(uri, fileUri, options);
  const response = await task;
  const result = {
    ...normalizeHttpResult(response),
    uri: toFileUri(response.path() || destination),
  };
  if (options.md5) {
    result.md5 = await nativeFs.hash(destination, 'md5');
  }
  return result;
}

function uploadBody(fileUri, options) {
  const wrappedPath = ReactNativeBlobUtil.wrap(toNativePath(fileUri));
  if (options.uploadType !== FileSystemUploadType.MULTIPART) {
    return wrappedPath;
  }
  const fileName = toNativePath(fileUri).split('/').pop() || 'file';
  return [
    ...Object.entries(options.parameters ?? {}).map(([name, data]) => ({ name, data })),
    {
      name: options.fieldName ?? fileName.replace(/\.[^.]*$/, ''),
      filename: fileName,
      type: options.mimeType ?? 'application/octet-stream',
      data: wrappedPath,
    },
  ];
}

function createUploadRequest(url, fileUri, options, callback) {
  const method = String(options.httpMethod ?? 'POST').toUpperCase();
  if (!['POST', 'PUT', 'PATCH'].includes(method)) {
    throw new TypeError(`expo-file-system: unsupported upload HTTP method ${method}`);
  }
  const task = ReactNativeBlobUtil.fetch(method, url, options.headers ?? {}, uploadBody(fileUri, options));
  if (callback) {
    task.uploadProgress({ interval: 250 }, (sent, expected) => {
      callback({
        totalBytesExpectedToSend: Number(expected),
        totalBytesSent: Number(sent),
      });
    });
  }
  return task;
}

async function uploadAsync(url, fileUri, options = {}) {
  const normalizedOptions = {
    uploadType: FileSystemUploadType.BINARY_CONTENT,
    ...options,
  };
  const response = await createUploadRequest(url, fileUri, normalizedOptions);
  return {
    ...normalizeHttpResult(response),
    body: await response.text(),
  };
}

class FileSystemCancellableNetworkTask {
  constructor() {
    this.task = undefined;
    this.taskWasCanceled = false;
  }

  async cancelAsync() {
    if (this.taskWasCanceled) return;
    this.taskWasCanceled = true;
    this.task?.cancel();
  }

  assertNotCanceled() {
    if (!this.taskWasCanceled) return true;
    console.warn('This task was already canceled.');
    return false;
  }
}

class DownloadResumable extends FileSystemCancellableNetworkTask {
  constructor(uri, fileUri, options = {}, callback, resumeData) {
    super();
    this.url = uri;
    this.fileUri = fileUri;
    this.options = options;
    this.callback = callback;
    this.resumeData = resumeData;
  }

  async downloadAsync() {
    if (!this.assertNotCanceled()) return undefined;
    if (this.resumeData) {
      throw new UnavailabilityError('expo-file-system', 'resuming downloads on HarmonyOS');
    }
    const { destination, task } = createDownloadTask(this.url, this.fileUri, this.options, this.callback);
    this.task = task;
    const response = await task;
    const result = {
      ...normalizeHttpResult(response),
      uri: toFileUri(response.path() || destination),
    };
    if (this.options.md5) {
      result.md5 = await nativeFs.hash(destination, 'md5');
    }
    return result;
  }

  async pauseAsync() {
    throw new UnavailabilityError('expo-file-system', 'pausing downloads on HarmonyOS');
  }

  async resumeAsync() {
    throw new UnavailabilityError('expo-file-system', 'resuming downloads on HarmonyOS');
  }

  savable() {
    return {
      fileUri: this.fileUri,
      options: this.options,
      resumeData: this.resumeData,
      url: this.url,
    };
  }
}

class UploadTask extends FileSystemCancellableNetworkTask {
  constructor(url, fileUri, options = {}, callback) {
    super();
    this.url = url;
    this.fileUri = fileUri;
    this.options = {
      uploadType: FileSystemUploadType.BINARY_CONTENT,
      ...options,
    };
    this.callback = callback;
  }

  async uploadAsync() {
    if (!this.assertNotCanceled()) return undefined;
    const task = createUploadRequest(this.url, this.fileUri, this.options, this.callback);
    this.task = task;
    const response = await task;
    return {
      ...normalizeHttpResult(response),
      body: await response.text(),
    };
  }
}

function createDownloadResumable(uri, fileUri, options = {}, callback, resumeData) {
  return new DownloadResumable(uri, fileUri, options, callback, resumeData);
}

function createUploadTask(url, fileUri, options = {}, callback) {
  return new UploadTask(url, fileUri, options, callback);
}

const StorageAccessFramework = {
  getUriForDirectoryInRoot(folderName) {
    return unavailable('StorageAccessFramework.getUriForDirectoryInRoot');
  },
  async requestDirectoryPermissionsAsync() {
    return unavailable('StorageAccessFramework.requestDirectoryPermissionsAsync');
  },
  async readDirectoryAsync() {
    return unavailable('StorageAccessFramework.readDirectoryAsync');
  },
  async makeDirectoryAsync() {
    return unavailable('StorageAccessFramework.makeDirectoryAsync');
  },
  async createFileAsync() {
    return unavailable('StorageAccessFramework.createFileAsync');
  },
  writeAsStringAsync,
  readAsStringAsync,
  deleteAsync,
  moveAsync,
  copyAsync,
};

module.exports = {
  DownloadResumable,
  EncodingType,
  FileSystemCancellableNetworkTask,
  FileSystemSessionType,
  FileSystemUploadType,
  StorageAccessFramework,
  UploadTask,
  bundleDirectory,
  cacheDirectory,
  copyAsync,
  createDownloadResumable,
  createUploadTask,
  deleteAsync,
  deleteLegacyDocumentDirectoryAndroid: async () => {},
  documentDirectory,
  downloadAsync,
  getContentUriAsync: async uri => uri,
  getFreeDiskStorageAsync,
  getInfoAsync,
  getTotalDiskCapacityAsync,
  makeDirectoryAsync,
  moveAsync,
  readAsStringAsync,
  readDirectoryAsync,
  uploadAsync,
  writeAsStringAsync,
};
