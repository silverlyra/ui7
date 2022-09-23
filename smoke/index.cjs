/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */

const { v7, timestamp } = require('uuid7');

const id = v7();
console.log(id);
console.log(new Date(timestamp(id)));
