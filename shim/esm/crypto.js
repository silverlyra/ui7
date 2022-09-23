/* global globalThis */

export const crypto =
  globalThis.crypto ??
  (await import('node:crypto')).webcrypto ??
  (function (crypto) {
    return {
      getRandomValues(array) {
        array.set(crypto.randomBytes(array.length));
        return array;
      },
    };
  })(await import('node:crypto'));
