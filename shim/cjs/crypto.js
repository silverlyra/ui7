/* global globalThis, require */
/* eslint-disable @typescript-eslint/no-var-requires */

export const crypto =
  globalThis.crypto ||
  require('crypto').webcrypto ||
  (function (crypto) {
    return {
      getRandomValues(array) {
        return crypto.randomFillSync(array);
      },
    };
  })(require('crypto'));
