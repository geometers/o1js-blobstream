export const range = (min: number, max?: number): number[] => {
  const start = max === undefined ? 0 : min;
  const end = max === undefined ? min : max;
  return Array.from({ length: end - start }, (_, idx) => start + idx);
};
