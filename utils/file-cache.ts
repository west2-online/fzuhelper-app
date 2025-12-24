import * as FileSystem from 'expo-file-system/legacy';

const CACHE_DIR = `${FileSystem.documentDirectory}file_cache/`;

type GetCachedFileOptions = {
  filename?: string;
  maxAge?: number; // 毫秒，超过则重新下载
};

async function ensureCacheDir() {
  try {
    const info = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
    }
  } catch (e) {
    console.warn('ensureCacheDir error', e);
  }
}

function sanitizeSegment(seg: string) {
  // 保留字母数字、-、_、.，其它替换为下划线
  return seg.replace(/[^a-zA-Z0-9-_.]/g, '_').slice(0, 200);
}

function urlToCachePath(url: string) {
  try {
    const u = new URL(url);
    // 取 URL 的 pathname，去掉前导 /
    let p = u.pathname.replace(/^\//, '');
    if (!p) return sanitizeSegment(u.hostname);
    const parts = p.split('/').map(sanitizeSegment);
    return parts.join('/');
  } catch (e) {
    // 非标准 URL，则简单处理
    const safe = url.replace(/^file:\/\//, '').replace(/[:\/\\?&=]/g, '_');
    return sanitizeSegment(safe);
  }
}

export async function getCachedFile(url: string, options: GetCachedFileOptions = {}) {
  if (!url) throw new Error('url is required');

  await ensureCacheDir();

  // 允许传入带路径的 filename（例如 "learning-center/map.webp"）
  let relativePath = '';
  if (options.filename) {
    // 清理用户传入的 filename
    relativePath = options.filename.split('/').map(sanitizeSegment).join('/');
  } else {
    relativePath = urlToCachePath(url);
  }

  const targetPath = `${CACHE_DIR}${relativePath}`;

  // 确保目标目录存在
  const lastSlash = targetPath.lastIndexOf('/');
  if (lastSlash > 0) {
    const dir = targetPath.substring(0, lastSlash + 1);
    try {
      const dirInfo = await FileSystem.getInfoAsync(dir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      }
    } catch (e) {
      // 忽略目录创建错误，后续下载会尝试
    }
  }

  try {
    const info = await FileSystem.getInfoAsync(targetPath, { size: false });
    if (info.exists) {
      // 检查是否过期（如果提供了 maxAge 且系统返回了 modificationTime）
      if (options.maxAge && typeof info.modificationTime === 'number') {
        const ageMs = Date.now() - info.modificationTime * 1000; // modificationTime 为 seconds
        if (ageMs <= options.maxAge) {
          console.log('getCachedFile: cache hit and valid for', url);
          return info.uri; // 本地文件仍有效
        }
      } else if (!options.maxAge) {
        console.log('getCachedFile: cache hit for', url);
        return info.uri; // 没有设置过期，直接返回
      }
    }

    // 下载到目标路径（覆盖）
    try {
      const res = await FileSystem.downloadAsync(url, targetPath);
      console.log('getCachedFile: downloaded', url);
      return res.uri;
    } catch (downloadError) {
      console.warn('downloadAsync failed', downloadError);
      // 下载失败但本地存在则返回本地，否则抛出错误
      if (info && info.exists) return info.uri;
      console.error('getCachedFile download failed and no local cache', downloadError);
      throw downloadError;
    }
  } catch (err) {
    console.error('getCachedFile error', err);
    throw err;
  }
}

export async function clearCache() {
  try {
    const info = await FileSystem.getInfoAsync(CACHE_DIR);
    if (info.exists) {
      await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
    }
  } catch (e) {
    console.warn('clearCache error', e);
  }
}

export async function listCachedFiles() {
  try {
    const info = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!info.exists) return [];
    // 递归遍历目录，返回相对于 CACHE_DIR 的路径（保留子目录/文件名）
    async function walk(dir: string, prefix = ''): Promise<any[]> {
      try {
        const entries = await FileSystem.readDirectoryAsync(dir);
        const result: any[] = [];
        for (const entry of entries) {
          const fullPath = dir + entry;
          const relPath = prefix ? `${prefix}/${entry}` : entry;
          try {
            const entryInfo = await FileSystem.getInfoAsync(fullPath, { size: true });
            // isDirectory may not be present in all runtimes; use exists + readDirectory test
            if (entryInfo.exists) {
              // 尝试读取子目录来判断是否为目录
              try {
                const subEntries = await FileSystem.readDirectoryAsync(fullPath + '/');
                // 如果能读取则为目录
                if (Array.isArray(subEntries)) {
                  const sub = await walk(fullPath + '/', relPath);
                  result.push(...sub);
                  continue;
                }
              } catch (e) {
                // 不是目录
              }

              // 文件
              result.push({
                name: relPath,
                uri: entryInfo.uri,
                size: entryInfo.size ?? 0,
                modificationTime: (entryInfo as any).modificationTime ?? null,
              });
            }
          } catch (e) {
            // 忽略单个项错误
            continue;
          }
        }
        return result;
      } catch (e) {
        return [];
      }
    }

    const files = await walk(CACHE_DIR, '');
    return files;
  } catch (e) {
    console.warn('listCachedFiles error', e);
    return [];
  }
}

export default {
  getCachedFile,
  clearCache,
};
