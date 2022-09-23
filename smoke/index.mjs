/* eslint-env node */

import uuid, { timestamp } from 'uuid7';

const id = uuid();
console.log(id);
console.log(new Date(timestamp(id)));
