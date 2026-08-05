import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';

// 导出 QueryClient 实例供纯逻辑调用使用
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export const QueryProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const asyncStoragePersister = createAsyncStoragePersister({
    storage: AsyncStorage,
  });

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: asyncStoragePersister,
        buster: 'success-query-cache-v1',
        dehydrateOptions: {
          shouldDehydrateQuery: query => {
            // 仅持久化成功完成的 API 缓存，避免 pending query 在 hydrate 后 reject 时触发 TanStack Query 警告。
            return (
              query.options.meta?.persist === true && query.state.status === 'success' && query.state.data !== undefined
            );
          },
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
};
