// 标记部分键为可选
export type PartiallyOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// 推断异步函数返回值类型的类型体操
export type AsyncReturnType<
  T extends (...args: any) => Promise<any>, // 泛型参数 T 为一个返回 Promise 类型的函数
> = T extends (...args: any) => Promise<infer R> ? R : any; // 利用条件类型和 `infer` 关键字提取出函数返回值所包裹的实际类型 R
