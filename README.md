ui7
===

[![npm](https://img.shields.io/npm/v/ui7?color=gray&label=%20&logo=npm)][npm]
[![deno.land](https://img.shields.io/github/v/tag/silverlyra/ui7?color=gray&label=%20&logo=deno&sort=semver)][deno]
[![CI](https://img.shields.io/github/actions/workflow/status/silverlyra/ui7/ci.yml?label=%20&logo=github)][build]
[![includes TypeScript types](https://img.shields.io/npm/types/ui7?color=333&label=%20&logo=typescript&logoColor=58baee)][typescript]
![node-current](https://img.shields.io/node/v/ui7?color=444&label=%20&logo=node.js)
[![MIT license](https://img.shields.io/npm/l/ui7?color=3ae)][license]

[npm]: https://www.npmjs.com/package/ui7
[deno]: https://deno.land/x/ui7
[build]: https://github.com/silverlyra/ui7/actions/workflows/ci.yml?query=branch%3Amain
[typescript]: https://deno.land/x/ui7/mod.ts
[license]: ./LICENSE

A small [UUIDv7][] generator, targeting the [latest draft][] update to [RFC 4122][]. v7 UUID’s are lexically sortable by their included timestamp.

[UUIDV7]: https://www.ietf.org/archive/id/draft-peabody-dispatch-new-uuid-format-04.html#name-uuid-version-7
[latest draft]: https://www.ietf.org/archive/id/draft-peabody-dispatch-new-uuid-format-04.html
[RFC 4122]: https://datatracker.ietf.org/doc/html/rfc4122

```js
import uuid, { timestamp } from "ui7";

const id = uuid();
// ==> "01836531-a895-7a2d-a70d-504ea62b40e2"

const when = new Date(timestamp(id));
// ==> 2022-09-22T12:34:56.789Z
```

## Installation

ui7 is available on [NPM][npm] and [deno.land][deno]:

#### npm

```sh
npm install --save ui7
```

Node.js versions 12.0 and up are supported, and _ui7_ includes an ESM build. It has no runtime dependencies.

#### deno

```ts
import uuid from "https://deno.land/x/ui7@v0.2.1/mod.ts";
```

## Usage


### Default generator

The default UUIDv7 generator is available as both a default export and a named `v7` function:

```js
import uuid from "ui7";

console.log(uuid());
// ==> "01836d65-3ec5-789f-b509-9ebd1d5ac2d3"
```

```js
import { v7 } from "ui7";

console.log(v7());
// ==> "01836d65-4a33-7aeb-aceb-8bfe42901787"
```

### Monotonic generators

Version 7 UUID’s include a millisecond-precision timestamp part and a random part. By default, _ui7_ will fully populate the random part with random bits. This means that ID’s generated during the same millisecond will sort in an arbitrary order:

```js
import uuid from "ui7";

const ids = [uuid(), uuid(), uuid()];
// [
//   "01836d99-1b31-75c7-bb83-aa52c651b085",
//   "01836d99-1b31-7b6a-8010-98fe59822b40",
//   "01836d99-1b31-71c4-bed3-6d3111c2de7d"
// ]

[...ids].sort().map(id => ids.indexOf(id))
// [ 2, 0, 1 ]
```

If you want UUID’s generated in the same process to sort in the order they were generated, you can instead create a _monotonic_ generator:

```js
import { generator } from "ui7";

// `generator` uses a monotonic entropy source by default.
const uuid = generator();

const ids = [uuid(), uuid(), uuid()];
// [
//   "01836da2-8a0d-7429-812d-f23f4d3d14c1",
//   "01836da2-8a0d-742a-89a3-0442ac613d11",
//   "01836da2-8a0d-742b-85e0-476f85ee36d9"
// ]

[...ids].sort().map(id => ids.indexOf(id))
// [ 0, 1, 2 ]
```

This uses the 12-bit `rand_a` field of UUIDv7 as a counter. For the first timestamp generated in a particular millisecond, the high bit is set to 0, so that there are always at least 2¹¹ (2,048) sequential counter values available before the field overflows (and wraps back to 0).

### Retrieving the timestamp

Use the `timestamp` function to read the timestamp field of a UUIDv7:

```js
import { timestamp } from "ui7";

const when = timestamp("01836db9-3d80-7df2-9c5e-d66442a3cf21");
// 1663993200000

const date = new Date(when);
// 2022-09-24T04:20:00.000Z
```

If the input to `timestamp` is not a UUIDv7, it throws a `ParseError` exception.

### Customizing generation

The default `uuid` function, the `generator` factory function, and the functions returned by `generator` all accept some options to customize their behavior.

#### Setting the time

You can pass a numeric timestamp, `Date` object, or custom clock function to a UUID generator or factory:

```js
import uuid from "ui7";

const id1 = uuid(0);
// "00000000-0000-7e2f-898b-a1f288a85661"

const id2 = uuid(new Date("2009-08-23T03:58:16.491Z"));
// "01234567-89ab-772e-9998-11f7395091b3"

const id3 = uuid(() => Date.now() * 2);
// "0306db58-42bc-722f-b2a5-4b13763cc462"

// Pass an object with a `time` property to combine with other options:
const id4 = uuid({ time: 1663993200000 });
// "01836db9-3d80-74a3-8b2a-8bf75bae40d5"
```

#### Controlling the format

You can omit dashes from the generated UUID’s, or use upper-case hex characters:

```js
import uuid from "ui7";

const id1 = uuid({ dashes: false });
// "01836db3b12d7f4e88c9fdc29019862e"

const id2 = uuid({ upper: true });
// "01836DB3-E2C7-7C84-8EB7-5CBE9205615B"

const id3 = uuid({ dashes: false, upper: true });
// "01836DB44DEF7836B69838F38A0A2A2A"
```

#### Using a different entropy source

By default, _ui7_ uses [`crypto.getRandomValues`][webcrypto] to populate the random part of the UUID (or [`crypto.randomFillSync`][fillsync] on Node.js versions that don't support Web-compatible crypto).

To instead set the "random" bits to either all `0` or all `1`, pass a literal `0` or `0xff` as the `entropy` option:

```js
import uuid from "ui7";

const id1 = uuid({ entropy: 0 });
// "018abdfe-4693-7000-8000-000000000000"

const id2 = uuid({ entropy: 0xff })
// "018abdfe-4693-7fff-bfff-ffffffffffff"
```

Full control is available by providing an `entropy` function, which must return a [`Uint8Array`][u8a] with the requested `byteLength`:

```js
import uuid from "ui7";

const id1 = uuid({ entropy: (n) => new Uint8Array(n) });
// "01836db8-4831-7000-8000-000000000000"

const id2 = uuid({ entropy: (n) => new Uint8Array(n).map((_, i) => i) })
// "01836dbb-bd3d-7001-8203-040506070809"

// The entropy function receives the timestamp of the ID being generated:
const id4 = uuid({
  entropy(n, time) {
    const b = new Uint8Array(n);
    new DataView(b.buffer).setBigUint64(0, BigInt(time));
    return b;
  }
});
// "01836dbd-448c-7000-8183-6dbd448c0000"
```

Note that the default implementation avoids making a `getRandomValues` call every time `entropy()` is called; it makes larger, less infrequent reads to improve performance when many UUID's are being generated.

[webcrypto]: https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues
[fillsync]: https://nodejs.org/api/crypto.html#cryptorandomfillsyncbuffer-offset-size
[u8a]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array

#### Creating a preset

In addition to providing options to the default generator, you can pass them to the `generator` factory function, which will return a generator that uses those options as its defaults:

```ts
import { generator } from "ui7";

const uuid = generator({
  time: () => Math.trunc(Date.now() / 1000),
  entropy: (n) => new Uint8Array(n).map(() => 0xFF),
  upper: true,
});

const id1 = uuid();
// "0000632F-3ACC-7FFF-BFFF-FFFFFFFFFFFF"

// Options can still be set for each individual ID:
const id2 = uuid({ dashes: false, time: 0 }):
// "0000000000007FFFBFFFFFFFFFFFFFFF"
```

### TypeScript

_ui7_ is written in TypeScript and ships with type definitions.

## Should I use this?

UUID’s are currently defined by [RFC 4122][] (2005), which specifies three UUID versions in common use: 1, 4, and 5. The “UUIDv7” identifiers generated by this package conform to [a proposed update][ietf tracker] to that standard, but as of this writing (September 2023) it has not yet obsoleted the 2005 edition.

UUIDv7 – a sortable UUID containing a UNIX timestamp – was first proposed in the second draft from April 2021. Originally, UUIDv7 held a variable-precision timestamp, but this was simplified to millisecond precision only in the fourth draft from March 2022. This implementation originally targeted a [June 2022][dcl] draft.

There are advantages to the UUIDv7 format: they encode a timestamp, while still being collision-resistant with up to 74 bits of entropy per UUID. Their natural sortability by putting the timestamp field first is convenient for display and efficient for insertion into the [B-tree][] structures that underlie many databases. And they're still UUID's, and can be used directly in (e.g.) a Postgres `uuid` column without conversion.

But you might reasonably decide to say “no” or “not yet” to UUIDv7 until it is specified in an accepted RFC, or to use a different unique identifier format like [ULID][].

### Should I use this implementation?

_ui7_ is a compact, zero-dependency implementation of UUIDv7, using a cryptographic PRNG provided by its host environment. It is one of the simplest, but neither the fastest nor the slowest implementation; [a few others][others] can be found on NPM.

[ietf tracker]: https://datatracker.ietf.org/doc/draft-ietf-uuidrev-rfc4122bis/
[dcl]: https://www.ietf.org/archive/id/draft-peabody-dispatch-new-uuid-format-04.html#section-3.1-2
[B-tree]: https://www.cs.cornell.edu/courses/cs3110/2012sp/recitations/rec25-B-trees/rec25.html
[ULID]: https://github.com/ulid/spec#readme
[others]: https://www.npmjs.com/search?q=uuidv7
