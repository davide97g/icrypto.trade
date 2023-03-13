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

export const roundToNDigits = (n: number, digits: number) => {
  const multiplier = Math.pow(10, digits);
  return Math.round(n * multiplier) / multiplier;
};
