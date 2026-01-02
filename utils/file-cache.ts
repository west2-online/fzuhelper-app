import type { FileInfo } from 'expo-file-system/legacy';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import * as mime from 'react-native-mime-types';

export const CACHE_DIR = `${FileSystem.cacheDirectory}file/`;
const META_EXT = '.meta.json';

export type GetCachedFileOptions = {
  filename?: string;
  maxAge?: number; // 毫秒
  onProgress?: (progress: number) => void; // 0..1
};

export type CachedFile = {
  name: string;
  uri: string;
  size: number;
  modificationTime?: number | null; // seconds
};

export type FileMeta = {
  cachedAt: number;
  maxAgeMs: number | null;
};

type CachedFileWithMeta = CachedFile & { __meta?: FileMeta | null };

// 确保目录存在；如果不存在则尝试创建
async function ensureDir(path: string): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) await FileSystem.makeDirectoryAsync(path, { intermediates: true });
  } catch (err) {
    console.log('file-cache: ensureDir error', err);
  }
}

/**
 * 将路径片段净化为文件系统安全的名称：
 * - 仅保留字母、数字、短横线/下划线/点
 * - 其余字符替换为下划线
 * - 限制长度以避免过长路径
 */
function sanitizeSegment(seg: string): string {
  return seg.replace(/[^a-zA-Z0-9-_.]/g, '_').slice(0, 200);
}

/**
 * 将 URL 转换为相对缓存路径：
 * - 优先尝试通过 URL 解析出路径片段并逐段 sanitize，作为目录结构存储。
 * - 如果不是标准 URL（例如 file:// 或其他字符串），则回退到替换非法字符的安全字符串。
 */
function urlToCachePath(url: string): string {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.replace(/^\//, '');
    if (!pathname) return sanitizeSegment(parsed.hostname);
    return pathname.split('/').map(sanitizeSegment).join('/');
  } catch {
    const safe = url.replace(/^file:\/\//, '').replace(/[:/\\?&=]/g, '_');
    return sanitizeSegment(safe);
  }
}

// 获取文件对应的 metadata 文件路径
function metaPathFor(fileUri: string): string {
  return `${fileUri}${META_EXT}`;
}

// 读取文件的 metadata
async function readMetadataFor(fileUri: string): Promise<FileMeta | null> {
  try {
    const metaPath = metaPathFor(fileUri);
    const txt = await FileSystem.readAsStringAsync(metaPath);
    const parsed = JSON.parse(txt) as FileMeta;
    return parsed;
  } catch {
    return null;
  }
}

// 写入文件的 metadata
async function writeMetadataFor(fileUri: string, meta: FileMeta): Promise<void> {
  try {
    const metaPath = metaPathFor(fileUri);
    await FileSystem.writeAsStringAsync(metaPath, JSON.stringify(meta));
  } catch (err) {
    console.log('file-cache: writeMetadataFor error', err);
  }
}

/**
 * 获取缓存文件的本地 URI：
 * - 如果缓存存在且未过期（根据 maxAge 或 metadata），直接返回本地 URI。
 * - 否则下载文件并缓存，返回新的本地 URI。
 */
export async function getCachedFile(url: string, options: GetCachedFileOptions = {}): Promise<string> {
  if (!url) throw new Error('url is required');
  await ensureDir(CACHE_DIR);

  const relativePath = options.filename
    ? options.filename.split('/').map(sanitizeSegment).join('/')
    : urlToCachePath(url);
  const targetPath = `${CACHE_DIR}${relativePath}`;

  // 确保目标文件所在目录存在
  const lastSlash = targetPath.lastIndexOf('/');
  if (lastSlash > 0) await ensureDir(targetPath.substring(0, lastSlash + 1));

  try {
    const [fileInfo, metaInfo] = (await Promise.all([
      FileSystem.getInfoAsync(targetPath),
      FileSystem.getInfoAsync(metaPathFor(targetPath)),
    ])) as [FileInfo, FileInfo];
    // 如果缺少任一项，则视为缓存不一致，强制重新下载
    if (fileInfo.exists && metaInfo.exists) {
      if (typeof options.maxAge === 'number' && typeof fileInfo.modificationTime === 'number') {
        const ageMs = Date.now() - fileInfo.modificationTime * 1000;
        if (ageMs <= options.maxAge) {
          console.log('file-cache: cache hit within maxAge', targetPath);
          // 如果使用，异步更新 cachedAt/maxAge
          writeMetadataFor(fileInfo.uri, { cachedAt: Date.now(), maxAgeMs: options.maxAge });
          return fileInfo.uri;
        }
      } else if (options.maxAge == null) {
        console.log('file-cache: cache hit (no maxAge)', targetPath);
        return fileInfo.uri;
      }
    }

    // 下载文件并回调进度
    options.onProgress?.(0);
    const downloadResumable = FileSystem.createDownloadResumable(url, targetPath, {}, progress => {
      const written = progress.totalBytesWritten ?? 0;
      const total = progress.totalBytesExpectedToWrite ?? 0;
      const percent = total > 0 ? written / total : 0;
      options.onProgress?.(Math.max(0, Math.min(1, percent)));
    });

    const res = await downloadResumable.downloadAsync();
    if (!res || !res.uri) {
      throw new Error('file-cache: download failed or returned no uri');
    }
    const downloadedUri = res.uri;
    // 下载成功后写入 metadata
    await writeMetadataFor(downloadedUri, {
      cachedAt: Date.now(),
      maxAgeMs: typeof options.maxAge === 'number' ? options.maxAge : null,
    });
    options.onProgress?.(1);
    console.log('file-cache: downloaded and cached', url, 'to', downloadedUri);
    return downloadedUri;
  } catch (err) {
    console.log('file-cache: getCachedFile error', err);
    throw err;
  }
}

// 列出缓存目录下的所有文件（递归）。
// includeMeta 为 true 时会尝试读取每个文件对应的 metadata（可能较慢）。
export async function listCachedFiles(includeMeta = false): Promise<CachedFileWithMeta[]> {
  try {
    const rootInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!rootInfo.exists) return [];
    // 递归遍历缓存目录，构建文件列表。
    const walk = async (dir: string, prefix = ''): Promise<CachedFileWithMeta[]> => {
      try {
        const entries = (await FileSystem.readDirectoryAsync(dir)).filter(e => !e.endsWith(META_EXT));
        const result: CachedFileWithMeta[] = [];

        // 并行获取 entry 的 FileInfo（容错单个失败），以减少多次同步调用开销
        const fullEntries = entries.map(entry => ({
          entry,
          fullPath: dir + entry,
          relPath: prefix ? `${prefix}/${entry}` : entry,
        }));
        const infoResults = await Promise.allSettled(fullEntries.map(e => FileSystem.getInfoAsync(e.fullPath)));

        for (let idx = 0; idx < fullEntries.length; idx++) {
          const { fullPath, relPath } = fullEntries[idx];
          const infoResult = infoResults[idx];
          if (infoResult.status !== 'fulfilled') continue;
          const entryInfo = infoResult.value as FileInfo;
          if (!entryInfo.exists) continue;

          if (entryInfo.isDirectory) {
            const sub = await walk(fullPath + '/', relPath);
            result.push(...sub);
            continue;
          }

          const fileObj: CachedFileWithMeta = {
            name: relPath,
            uri: entryInfo.uri,
            size: entryInfo.size ?? 0,
            modificationTime: entryInfo.modificationTime ?? null,
            __meta: includeMeta ? await readMetadataFor(entryInfo.uri) : null,
          };

          result.push(fileObj);
        }

        return result;
      } catch {
        return [];
      }
    };

    const files = await walk(CACHE_DIR, '');
    return files;
  } catch (err) {
    console.log('file-cache: listCachedFiles error', err);
    return [];
  }
}

// 清理过期缓存文件，返回删除的文件数量与列表
export async function cleanupExpired(
  maxAgeMs?: number,
  concurrency = 3,
): Promise<{ deleted: number; deletedFiles: string[] }> {
  try {
    await ensureDir(CACHE_DIR);
    const deletedFiles: string[] = [];

    const files = await listCachedFiles(true);
    const now = Date.now();

    for (let i = 0; i < files.length; i += concurrency) {
      const chunk = files.slice(i, i + concurrency);

      // 并行获取文件 info
      const infoResults = await Promise.allSettled(chunk.map(f => FileSystem.getInfoAsync(f.uri)));

      const ops = chunk.map(async (fileItem, idx) => {
        const meta = fileItem.__meta ?? null;
        let fileMaxAge: number | undefined | null = meta && typeof meta.maxAgeMs === 'number' ? meta.maxAgeMs : null;
        if (fileMaxAge == null) fileMaxAge = typeof maxAgeMs === 'number' ? maxAgeMs : undefined;
        if (typeof fileMaxAge !== 'number' || fileMaxAge <= 0) return null;

        const cachedAtMs = meta && typeof meta.cachedAt === 'number' ? meta.cachedAt : null;

        if (cachedAtMs == null) {
          const infoResult = infoResults[idx];
          if (infoResult.status !== 'fulfilled') return null;
          const info = infoResult.value as FileInfo;
          if (!info.exists) return null;
          if (typeof info.modificationTime === 'number') {
            const expiresAt = info.modificationTime * 1000 + (fileMaxAge as number);
            if (now > expiresAt) return fileItem.uri;
          }
          return null;
        }

        const expiresAt = cachedAtMs + (fileMaxAge as number);
        if (now > expiresAt) return fileItem.uri;
        return null;
      });

      const results = await Promise.all(ops);
      for (const uri of results) {
        if (!uri) continue;
        try {
          await deleteCachedFile(uri);
          deletedFiles.push(uri);
        } catch (err) {
          console.log('file-cache: cleanupExpired delete failed', uri, err);
        }
      }
    }

    if (deletedFiles.length > 0) console.log('file-cache: cleanupExpired deleted', deletedFiles.length, 'files');
    return { deleted: deletedFiles.length, deletedFiles };
  } catch (err) {
    console.log('file-cache: cleanupExpired error', err);
    return { deleted: 0, deletedFiles: [] };
  }
}

// 删除缓存文件及其 metadata
export async function deleteCachedFile(uri: string): Promise<void> {
  try {
    const [file, meta] = (await Promise.all([
      FileSystem.getInfoAsync(uri),
      FileSystem.getInfoAsync(metaPathFor(uri)),
    ])) as [FileInfo, FileInfo];

    if (!file.exists && !meta.exists) return;
    else if (file.exists !== meta.exists) {
      await Promise.all([
        file.exists ? FileSystem.deleteAsync(uri) : Promise.resolve(),
        meta.exists ? FileSystem.deleteAsync(metaPathFor(uri)) : Promise.resolve(),
      ]);
      console.log('file-cache: deleteCachedFile inconsistent state, deleted existing parts', uri);
      return;
    }

    // 同时删除，任何失败都作为异常抛出
    await Promise.all([FileSystem.deleteAsync(uri), FileSystem.deleteAsync(metaPathFor(uri))]);
    console.log('file-cache: deleteCachedFile done', uri);
  } catch (err) {
    console.log('file-cache: deleteCachedFile error', err);
    throw err;
  }
}

// 打开文件：Android 使用原生 intent，其他平台使用 share 作为通用 fallback
export async function openFile(uri: string): Promise<boolean> {
  try {
    if (!uri) return false;
    if (Platform.OS === 'android') {
      let path = uri;
      if (path.startsWith('file://')) path = path.replace(/^file:\/\//, '');
      else if (path.startsWith('file:/')) path = path.replace(/^file:\//, '/');
      if (!path.startsWith('/')) path = '/' + path;
      ReactNativeBlobUtil.android.actionViewIntent(path, mime.lookup(uri) || 'application/octet-stream');
      return true;
    }
    return await shareFile(uri);
  } catch (err) {
    console.log('file-cache: openFile error', err);
    return false;
  }
}

// 通过 expo-sharing 分享文件
export async function shareFile(uri: string): Promise<boolean> {
  try {
    if (!uri) return false;
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri);
      return true;
    }
    return false;
  } catch (err) {
    console.log('file-cache: shareFile error', err);
    return false;
  }
}

const fileCache = {
  CACHE_DIR,
  getCachedFile,
  deleteCachedFile,
  listCachedFiles,
  cleanupExpired,
  openFile,
  shareFile,
};

export default fileCache;
