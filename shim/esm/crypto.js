/* global globalThis */

export const crypto =
  globalThis.crypto ??
  (await import('node:crypto')).webcrypto ??
  (function (crypto) {
    return {
      getRandomValues(array) {
        return crypto.randomFillSync(array);
      },
    };
  })(await import('node:crypto'));
