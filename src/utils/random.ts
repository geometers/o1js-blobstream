export const getRandomString = (size: number) =>
  [...Array(size)]
    .map(() => Math.floor(Math.random() * 36).toString(36))
    .join('');
