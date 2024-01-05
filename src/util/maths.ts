export function between(start: number, mid: number, end: number): boolean {
  return (start < mid && mid < end) || (start > mid && mid > end);
}

export function signedDiffModulo(a: number, b: number, mod: number): number {
  const diff = a % mod - b % mod;
  return mod < diff*2 ? diff - mod : diff;
}