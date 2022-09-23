/* global globalThis, require */
/* eslint-disable @typescript-eslint/no-var-requires */

export const crypto =
  globalThis.crypto ||
  require('crypto').webcrypto ||
  (function (crypto) {
    return {
      getRandomValues(array) {
        array.set(crypto.randomBytes(array.length));
        return array;
      },
    };
  })(require('crypto'));
