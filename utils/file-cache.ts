import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import * as mime from 'react-native-mime-types';

const CACHE_DIR = `${FileSystem.cacheDirectory}file/`;
const META_EXT = '.meta.json';

export type GetCachedFileOptions = {
  filename?: string;
  maxAge?: number; // 毫秒，超过则重新下载
  onProgress?: (progress: number) => void; // 0..1
};

export type CachedFile = {
  name: string;
  uri: string;
  size: number;
  modificationTime?: number | null; // seconds
};

async function ensureDir(path: string) {
  try {
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) await FileSystem.makeDirectoryAsync(path, { intermediates: true });
  } catch (e) {
    // best-effort
  }
}

function sanitizeSegment(seg: string) {
  return seg.replace(/[^a-zA-Z0-9-_.]/g, '_').slice(0, 200);
}

function urlToCachePath(url: string) {
  try {
    const u = new URL(url);
    let p = u.pathname.replace(/^\//, '');
    if (!p) return sanitizeSegment(u.hostname);
    return p.split('/').map(sanitizeSegment).join('/');
  } catch (e) {
    const safe = url.replace(/^file:\/\//, '').replace(/[:\/\\?&=]/g, '_');
    return sanitizeSegment(safe);
  }
}

function metaPathFor(fileUri: string) {
  return `${fileUri}${META_EXT}`;
}

async function readMetadataFor(fileUri: string) {
  try {
    const metaPath = metaPathFor(fileUri);
    const info = await FileSystem.getInfoAsync(metaPath);
    if (!info.exists) return null;
    const txt = await FileSystem.readAsStringAsync(metaPath);
    return JSON.parse(txt);
  } catch (e) {
    return null;
  }
}

async function writeMetadataFor(fileUri: string, meta: any) {
  try {
    const metaPath = metaPathFor(fileUri);
    await FileSystem.writeAsStringAsync(metaPath, JSON.stringify(meta));
  } catch (e) {
    // ignore
  }
}

export async function clearCache() {
  try {
    const info = await FileSystem.getInfoAsync(CACHE_DIR);
    if (info.exists) {
      await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
      console.log('file-cache: clearCache removed cache directory');
    }
  } catch (e) {
    console.warn('file-cache: clearCache error', e);
  }
}

export async function listCachedFiles(includeMeta = false) {
  try {
    const info = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!info.exists) return [];
    // 递归遍历目录，返回相对于 CACHE_DIR 的路径（保留子目录/文件名）
    async function walk(dir: string, prefix = ''): Promise<any[]> {
      try {
        const entries = await FileSystem.readDirectoryAsync(dir);
        const result: any[] = [];
        for (const entry of entries) {
          // 跳过 metadata 文件
          if (entry.endsWith(META_EXT)) continue;
          const fullPath = dir + entry;
          const relPath = prefix ? `${prefix}/${entry}` : entry;
          try {
            const entryInfo = (await FileSystem.getInfoAsync(fullPath)) as any;
            if (!entryInfo.exists) continue;

            // 判断是否目录（readDirectory 成功则为目录）
            let isDir = false;
            try {
              const sub = await FileSystem.readDirectoryAsync(fullPath + '/');
              if (Array.isArray(sub)) isDir = true;
            } catch (e) {
              isDir = false;
            }

            if (isDir) {
              const sub = await walk(fullPath + '/', relPath);
              result.push(...sub);
            } else {
              const fileObj: any = {
                name: relPath,
                uri: entryInfo.uri,
                size: entryInfo.size ?? 0,
                modificationTime: entryInfo.modificationTime ?? null,
              };
              if (includeMeta) {
                try {
                  const mp = metaPathFor(entryInfo.uri);
                  const mi = (await FileSystem.getInfoAsync(mp)) as any;
                  if (mi.exists) {
                    const txt = await FileSystem.readAsStringAsync(mp);
                    fileObj.__meta = JSON.parse(txt);
                  } else {
                    fileObj.__meta = null;
                  }
                } catch (e) {
                  fileObj.__meta = null;
                }
              }
              result.push(fileObj);
            }
          } catch (e) {
            continue;
          }
        }
        return result;
      } catch (e) {
        return [];
      }
    }

    const files = await walk(CACHE_DIR, '');
    console.log('file-cache: listCachedFiles found', files.length, 'files');
    return files;
  } catch (e) {
    console.warn('file-cache: listCachedFiles error', e);
    return [];
  }
}

export async function cleanupExpired(maxAgeMs?: number, concurrency = 3) {
  try {
    console.log('file-cache: cleanupExpired start', { maxAgeMs, concurrency });
    await ensureDir(CACHE_DIR);
    const files = await listCachedFiles(true);
    const now = Date.now();

    const deletedFiles: string[] = [];

    // process in chunks to limit concurrent FS operations
    for (let i = 0; i < files.length; i += concurrency) {
      const chunk = files.slice(i, i + concurrency);
      const ops = chunk.map(async (f: any) => {
        try {
          const meta = f.__meta ?? null;
          let fileMaxAge = meta && typeof meta.maxAgeMs === 'number' ? meta.maxAgeMs : null;
          if (fileMaxAge == null) fileMaxAge = typeof maxAgeMs === 'number' ? maxAgeMs : undefined;
          if (typeof fileMaxAge !== 'number' || fileMaxAge <= 0) return null;

          // 优先使用 metadata.cachedAt（毫秒），否则使用 modificationTime（秒）
          const cachedAtMs =
            meta && typeof meta.cachedAt === 'number'
              ? meta.cachedAt
              : f.modificationTime
                ? f.modificationTime * 1000
                : null;
          if (cachedAtMs == null) {
            // fallback: try to read file info
            const info = (await FileSystem.getInfoAsync(f.uri)) as any;
            if (!info.exists) return null;
            if (typeof info.modificationTime === 'number') {
              const m = info.modificationTime;
              const expiresAt = m * 1000 + fileMaxAge;
              if (now > expiresAt) {
                console.log('file-cache: cleanupExpired candidate (by info.modificationTime)', f.uri, { expiresAt });
                return f.uri;
              }
              return null;
            }
            return null;
          }
          const expiresAt = cachedAtMs + fileMaxAge;
          if (now > expiresAt) {
            console.log('file-cache: cleanupExpired candidate (by meta.cachedAt)', f.uri, { expiresAt });
            return f.uri;
          }
          return null;
        } catch (e) {
          console.warn('file-cache: cleanupExpired item error', e);
          return null;
        }
      });

      const results = await Promise.all(ops);
      for (const uri of results) {
        if (!uri) continue;
        try {
          await FileSystem.deleteAsync(uri, { idempotent: true });
          try {
            await FileSystem.deleteAsync(metaPathFor(uri), { idempotent: true });
          } catch (e) {}
          deletedFiles.push(uri);
        } catch (e) {
          console.warn('file-cache: cleanupExpired delete failed', uri, e);
        }
      }
    }

    const deleted = deletedFiles.length;
    if (deleted > 0) console.log('file-cache: cleanupExpired deleted', deleted, 'files');
    return { deleted, deletedFiles };
  } catch (e) {
    console.warn('file-cache: cleanupExpired error', e);
    return { deleted: 0, deletedFiles: [] };
  }
}

export async function deleteCachedFile(uri: string) {
  try {
    // delete file or directory
    await FileSystem.deleteAsync(uri, { idempotent: true });
    try {
      await FileSystem.deleteAsync(metaPathFor(uri), { idempotent: true });
    } catch (e) {}
    console.log('file-cache: deleteCachedFile done', uri);
  } catch (e) {
    console.warn('file-cache: deleteCachedFile error', e);
  }
}

export async function getCachedFile(url: string, options: GetCachedFileOptions = {}) {
  if (!url) throw new Error('url is required');

  await ensureDir(CACHE_DIR);

  let relativePath = '';
  if (options.filename) {
    relativePath = options.filename.split('/').map(sanitizeSegment).join('/');
  } else {
    relativePath = urlToCachePath(url);
  }

  const targetPath = `${CACHE_DIR}${relativePath}`;

  // ensure target directory exists
  const lastSlash = targetPath.lastIndexOf('/');
  if (lastSlash > 0) {
    const dir = targetPath.substring(0, lastSlash + 1);
    await ensureDir(dir);
  }

  try {
    const info = await FileSystem.getInfoAsync(targetPath);
    if (info.exists) {
      if (options.maxAge && typeof info.modificationTime === 'number') {
        const ageMs = Date.now() - info.modificationTime * 1000;
        if (ageMs <= options.maxAge) {
          console.log('file-cache: cache hit within maxAge', targetPath);
          try {
            // 仅在 metadata 不存在或 maxAge 发生变化时写入，减少磁盘写入
            const existingMeta = await readMetadataFor(info.uri);
            const existingMax =
              existingMeta && typeof existingMeta.maxAgeMs === 'number' ? existingMeta.maxAgeMs : null;
            if (existingMeta == null || existingMax !== options.maxAge) {
              await writeMetadataFor(info.uri, {
                url,
                cachedAt: Date.now(),
                maxAgeMs: options.maxAge,
              });
            }
          } catch (e) {}
          return info.uri;
        }
      } else if (!options.maxAge) {
        console.log('file-cache: cache hit (no maxAge)', targetPath);
        return info.uri;
      }
    }

    // use Expo FileSystem resumable download to provide progress
    try {
      options.onProgress?.(0);
      const downloadResumable = FileSystem.createDownloadResumable(url, targetPath, {}, progress => {
        try {
          const written = progress.totalBytesWritten;
          const total = progress.totalBytesExpectedToWrite;
          const p = total && total > 0 ? written / total : 0;
          options.onProgress?.(Math.max(0, Math.min(1, p)));
        } catch (e) {}
      });
      const res = await downloadResumable.downloadAsync();
      try {
        await writeMetadataFor(res.uri, {
          url,
          cachedAt: Date.now(),
          maxAgeMs: typeof options.maxAge === 'number' ? options.maxAge : null,
        });
      } catch (e) {}
      options.onProgress?.(1);
      return res.uri;
    } catch (e) {
      console.warn('file-cache: expo resumable download failed', e);
      // fallback: attempt downloadAsync as last resort
      const res = await FileSystem.downloadAsync(url, targetPath);
      try {
        await writeMetadataFor(res.uri, {
          url,
          cachedAt: Date.now(),
          maxAgeMs: typeof options.maxAge === 'number' ? options.maxAge : null,
        });
      } catch (e) {}
      options.onProgress?.(1);
      return res.uri;
    }
  } catch (err) {
    throw err;
  }
}

export async function openFile(uri: string) {
  try {
    if (!uri) return false;
    if (Platform.OS === 'android') {
      // ReactNativeBlobUtil.android.actionViewIntent 需要绝对文件路径（不带 file: 前缀）
      let path = uri;
      if (path.startsWith('file://')) {
        path = path.replace(/^file:\/\//, '');
      } else if (path.startsWith('file:/')) {
        path = path.replace(/^file:\//, '/');
      }
      // 确保以 / 开头
      if (!path.startsWith('/')) path = '/' + path;
      ReactNativeBlobUtil.android.actionViewIntent(path, mime.lookup(uri) || 'application/octet-stream');
      return true;
    } else {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
        return true;
      }
      return false;
    }
  } catch (e) {
    console.warn('file-cache: openFile error', e);
    return false;
  }
}

export async function shareFile(uri: string) {
  try {
    if (!uri) return false;
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri);
      return true;
    }
    return false;
  } catch (e) {
    console.warn('file-cache: shareFile error', e);
    return false;
  }
}

// note: automatic start/stop cleanup removed; use `cleanupExpired()` from layout.

export default {
  getCachedFile,
  deleteCachedFile,
  clearCache,
  listCachedFiles,
  cleanupExpired,
  openFile,
  shareFile,
};
