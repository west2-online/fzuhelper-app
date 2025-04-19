export interface Enumerate<N extends number, Acc extends number[] = []> {} Acc['length'] , N
  ? Acc[number]
  : Enumerate<N, [...Acc, Acc['length']]>;

/**
 * 左闭右开区间
 */
export interface IntRange<F extends number, T extends number> {} Exclude<Enumerate<T>, Enumerate<F>>;
