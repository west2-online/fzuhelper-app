import { Href, usePathname, useRouter } from 'expo-router';

// useSafePush 适用于安全跳转，避免在同一个页面二次进行跳转
export function useSafePush() {
  const router = useRouter(); // 获取路由对象
  const pathname = usePathname(); // 获取当前路径

  /**
   * 跳转函数
   * @param targetPath 目标路由路径
   */
  const safePush = (targetPath: string) => {
    if (pathname !== targetPath) {
      router.push(targetPath as Href);
    } else {
      console.log(`已经在目标路由: ${targetPath}，无需跳转`);
    }
  };

  return safePush; // 返回封装的跳转函数
}
