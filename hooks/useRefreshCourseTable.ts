import { useIsMutating, useMutation } from '@tanstack/react-query';

import { COURSE_PAGE_ALL_DATA_KEY } from '@/lib/constants';
import { refreshCourseTable } from '@/lib/custom-course-sync';

const refreshMutationKey = [COURSE_PAGE_ALL_DATA_KEY, 'refresh'];

export function useRefreshCourseTable() {
  const { mutateAsync } = useMutation({
    mutationKey: refreshMutationKey,
    mutationFn: refreshCourseTable,
  });
  const isRefreshing = useIsMutating({ mutationKey: refreshMutationKey }) > 0;

  return { refreshCourseTable: mutateAsync, isRefreshing };
}
