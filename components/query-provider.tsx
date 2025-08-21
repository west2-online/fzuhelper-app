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
        dehydrateOptions: {
          shouldDehydrateQuery: query => {
            // 当 persist 为 true 时，才会被持久化
            return query.options.meta?.persist === true;
          },
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
};
