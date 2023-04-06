export const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key: string, value: any) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    return value;
  };
};

export const cleanResponse = (error: any) =>
  JSON.stringify(error, getCircularReplacer());

export const roundToNDigits = (n: number, digits: number) => {
  if (digits <= 0) return Math.round(n);
  const multiplier = Math.pow(10, digits);
  return Math.round(n * multiplier) / multiplier;
};

export const sumArray = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
export const avgArray = (arr: number[]) => sumArray(arr) / arr.length;
