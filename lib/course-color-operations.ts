// 页面返回后重新进入时，仍需等待上一次内置配色切换完成。
let pending = false;
const listeners = new Set<() => void>();

export const getCourseColorOperationPending = (): boolean => pending;

export const subscribeCourseColorOperations = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const notify = () => {
  for (const listener of [...listeners]) {
    try {
      listener();
    } catch (error) {
      console.error('更新配色操作状态失败:', error);
    }
  }
};

export const beginCourseColorOperation = (): (() => void) | null => {
  if (pending) return null;
  pending = true;
  notify();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    pending = false;
    notify();
  };
};
