/* eslint-env node */

import Benchmark from 'benchmark';
import { generator, v7 as random } from 'ui7';

import { v1, v4 } from 'uuid';
import { uuidv7 } from 'uuidv7';
import { uuidv7 as kripod } from '@kripod/uuidv7';
import { ulid } from 'ulid';

const monotonic = generator();

const suite = new Benchmark.Suite();

if (process.argv.includes('compare')) {
  suite
    .add('uuidv1', v1)
    .add('uuidv4', v4)
    .add('uuidv7', uuidv7)
    .add('@kripod/uuidv7', kripod)
    .add('ulid', ulid);
}

suite.add('random', random).add('monotonic', monotonic);

suite
  .on('cycle', (event) => {
    console.log(String(event.target));
  })
  .run();
