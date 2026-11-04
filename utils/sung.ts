const LONG_WORD = 7;

export const sungWords = (title: string) =>
  title
    .trim()
    .split(/\s+/)
    .map(word => ({ word, long: word.length >= LONG_WORD }));
