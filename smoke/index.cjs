/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */

const { v7, generator, timestamp } = require('ui7');

const id = v7();
console.log(id);
console.log(new Date(timestamp(id)));
console.log();

const gen = generator();
for (let i = 0; i < 8; i++) console.log(gen());
