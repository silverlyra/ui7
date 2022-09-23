/* eslint-env node */

import uuid, { generator, timestamp } from 'uuid7';

const id = uuid();
console.log(id);
console.log(new Date(timestamp(id)));
console.log();

const gen = generator();
for (let i = 0; i < 8; i++) console.log(gen());
