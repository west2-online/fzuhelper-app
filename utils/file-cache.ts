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

type CachedFileWithMeta = CachedFile & { __meta?: any | null };

async function ensureDir(path: string): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) await FileSystem.makeDirectoryAsync(path, { intermediates: true });
  } catch (err) {
    console.warn('file-cache: ensureDir error', err);
  }
}

function sanitizeSegment(seg: string): string {
  return seg.replace(/[^a-zA-Z0-9-_.]/g, '_').slice(0, 200);
}

function urlToCachePath(url: string): string {
  try {
    const u = new URL(url);
    const p = u.pathname.replace(/^\//, '');
    if (!p) return sanitizeSegment(u.hostname);
    return p.split('/').map(sanitizeSegment).join('/');
  } catch (err) {
    const safe = url.replace(/^file:\/\//, '').replace(/[:\/\\?&=]/g, '_');
    return sanitizeSegment(safe);
  }
}

function metaPathFor(fileUri: string): string {
  return `${fileUri}${META_EXT}`;
}

async function readMetadataFor(fileUri: string): Promise<any | null> {
  try {
    const metaPath = metaPathFor(fileUri);
    const info = await FileSystem.getInfoAsync(metaPath);
    if (!info.exists) return null;
    const txt = await FileSystem.readAsStringAsync(metaPath);
    return JSON.parse(txt);
  } catch (err) {
    return null;
  }
}

async function writeMetadataFor(fileUri: string, meta: any): Promise<void> {
  try {
    const metaPath = metaPathFor(fileUri);
    await FileSystem.writeAsStringAsync(metaPath, JSON.stringify(meta));
  } catch (err) {
    console.warn('file-cache: writeMetadataFor error', err);
  }
}

async function isDirectory(path: string): Promise<boolean> {
  try {
    const list = await FileSystem.readDirectoryAsync(path.endsWith('/') ? path : `${path}/`);
    return Array.isArray(list);
  } catch {
    return false;
  }
}

export async function listCachedFiles(includeMeta = false): Promise<CachedFileWithMeta[]> {
  try {
    const rootInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!rootInfo.exists) return [];

    async function walk(dir: string, prefix = ''): Promise<CachedFileWithMeta[]> {
      try {
        const entries = await FileSystem.readDirectoryAsync(dir);
        const result: CachedFileWithMeta[] = [];
        for (const entry of entries) {
          if (entry.endsWith(META_EXT)) continue;
          const fullPath = dir + entry;
          const relPath = prefix ? `${prefix}/${entry}` : entry;
          try {
            const entryInfo: any = await FileSystem.getInfoAsync(fullPath);
            if (!entryInfo.exists) continue;

            if (await isDirectory(fullPath)) {
              const sub = await walk(fullPath + '/', relPath);
              result.push(...sub);
            } else {
              const fileObj: CachedFileWithMeta = {
                name: relPath,
                uri: entryInfo.uri,
                size: entryInfo.size ?? 0,
                modificationTime: entryInfo.modificationTime ?? null,
              };
              if (includeMeta) {
                try {
                  const mp = metaPathFor(entryInfo.uri);
                  const mi: any = await FileSystem.getInfoAsync(mp);
                  if (mi.exists) {
                    const txt = await FileSystem.readAsStringAsync(mp);
                    fileObj.__meta = JSON.parse(txt);
                  } else {
                    fileObj.__meta = null;
                  }
                } catch {
                  fileObj.__meta = null;
                }
              }
              result.push(fileObj);
            }
          } catch (err) {
            // ignore this entry
            continue;
          }
        }
        return result;
      } catch (err) {
        return [];
      }
    }

    const files = await walk(CACHE_DIR, '');
    console.log('file-cache: listCachedFiles found', files.length, 'files');
    return files;
  } catch (err) {
    console.warn('file-cache: listCachedFiles error', err);
    return [];
  }
}

export async function cleanupExpired(maxAgeMs?: number, concurrency = 3): Promise<{ deleted: number; deletedFiles: string[] }> {
  try {
    console.log('file-cache: cleanupExpired start', { maxAgeMs, concurrency });
    await ensureDir(CACHE_DIR);
    const files = await listCachedFiles(true);
    const now = Date.now();
    const deletedFiles: string[] = [];

    for (let i = 0; i < files.length; i += concurrency) {
      const chunk = files.slice(i, i + concurrency);
      const ops = chunk.map(async (f) => {
        try {
          const meta = f.__meta ?? null;
          let fileMaxAge: number | undefined | null = meta && typeof meta.maxAgeMs === 'number' ? meta.maxAgeMs : null;
          if (fileMaxAge == null) fileMaxAge = typeof maxAgeMs === 'number' ? maxAgeMs : undefined;
          if (typeof fileMaxAge !== 'number' || fileMaxAge <= 0) return null;

          const cachedAtMs = meta && typeof meta.cachedAt === 'number' ? meta.cachedAt : f.modificationTime ? f.modificationTime * 1000 : null;
          if (cachedAtMs == null) {
            const info: any = await FileSystem.getInfoAsync(f.uri);
            if (!info.exists) return null;
            if (typeof info.modificationTime === 'number') {
              const expiresAt = info.modificationTime * 1000 + fileMaxAge;
              if (now > expiresAt) return f.uri;
            }
            return null;
          }
          const expiresAt = cachedAtMs + fileMaxAge;
          if (now > expiresAt) return f.uri;
          return null;
        } catch (err) {
          console.warn('file-cache: cleanupExpired item error', err);
          return null;
        }
      });

      const results = await Promise.all(ops);
      for (const uri of results) {
        if (!uri) continue;
        try {
          await deleteCachedFile(uri);
          deletedFiles.push(uri);
        } catch (err) {
          console.warn('file-cache: cleanupExpired delete failed', uri, err);
        }
      }
    }

    if (deletedFiles.length > 0) console.log('file-cache: cleanupExpired deleted', deletedFiles.length, 'files');
    return { deleted: deletedFiles.length, deletedFiles };
  } catch (err) {
    console.warn('file-cache: cleanupExpired error', err);
    return { deleted: 0, deletedFiles: [] };
  }
}

export async function deleteCachedFile(uri: string): Promise<void> {
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
    try {
      await FileSystem.deleteAsync(metaPathFor(uri), { idempotent: true });
    } catch {
      // ignore meta deletion error
    }
    console.log('file-cache: deleteCachedFile done', uri);
  } catch (err) {
    console.warn('file-cache: deleteCachedFile error', err);
  }
}

export async function getCachedFile(url: string, options: GetCachedFileOptions = {}): Promise<string> {
  if (!url) throw new Error('url is required');

  await ensureDir(CACHE_DIR);

  const relativePath = options.filename ? options.filename.split('/').map(sanitizeSegment).join('/') : urlToCachePath(url);
  const targetPath = `${CACHE_DIR}${relativePath}`;

  // ensure parent directory exists
  const lastSlash = targetPath.lastIndexOf('/');
  if (lastSlash > 0) await ensureDir(targetPath.substring(0, lastSlash + 1));

  try {
    const info: any = await FileSystem.getInfoAsync(targetPath);
    if (info.exists) {
      if (typeof options.maxAge === 'number' && typeof info.modificationTime === 'number') {
        const ageMs = Date.now() - info.modificationTime * 1000;
        if (ageMs <= options.maxAge) {
          console.log('file-cache: cache hit within maxAge', targetPath);
          try {
            const existingMeta = await readMetadataFor(info.uri);
            const existingMax = existingMeta && typeof existingMeta.maxAgeMs === 'number' ? existingMeta.maxAgeMs : null;
            if (existingMeta == null || existingMax !== options.maxAge) {
              await writeMetadataFor(info.uri, { url, cachedAt: Date.now(), maxAgeMs: options.maxAge });
            }
          } catch {
            // ignore metadata write errors
          }
          return info.uri;
        }
      } else if (options.maxAge == null) {
        console.log('file-cache: cache hit (no maxAge)', targetPath);
        return info.uri;
      }
    }

    // download with progress
    options.onProgress?.(0);
    const downloadResumable = FileSystem.createDownloadResumable(url, targetPath, {}, (progress) => {
      try {
        const written = progress.totalBytesWritten ?? 0;
        const total = progress.totalBytesExpectedToWrite ?? 0;
        const p = total > 0 ? written / total : 0;
        options.onProgress?.(Math.max(0, Math.min(1, p)));
      } catch {
        // ignore progress errors
      }
    });

    const res = await downloadResumable.downloadAsync();
    try {
      await writeMetadataFor(res.uri, { url, cachedAt: Date.now(), maxAgeMs: typeof options.maxAge === 'number' ? options.maxAge : null });
    } catch {
      // ignore
    }
    options.onProgress?.(1);
    console.log('file-cache: downloaded and cached', url, 'to', res.uri);
    return res.uri;
  } catch (err) {
    console.warn('file-cache: getCachedFile error', err);
    throw err;
  }
}

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
    console.warn('file-cache: openFile error', err);
    return false;
  }
}

export async function shareFile(uri: string): Promise<boolean> {
  try {
    if (!uri) return false;
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri);
      return true;
    }
    return false;
  } catch (err) {
    console.warn('file-cache: shareFile error', err);
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
