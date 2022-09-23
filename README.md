uuid7
=====

Generate [UUIDv7][] identifiers, based on the [latest draft][] update to [RFC 4122][].

[UUIDV7]: https://datatracker.ietf.org/doc/html/draft-peabody-dispatch-new-uuid-format-04#section-5.2
[latest draft]: https://datatracker.ietf.org/doc/html/draft-peabody-dispatch-new-uuid-format-04
[RFC 4122]: https://datatracker.ietf.org/doc/html/rfc4122

```js
import uuid, { timestamp } from 'uuid7';

const id = uuid();
// ==> 01836531-a895-7a2d-a70d-504ea62b40e2

console.log(new Date(timestamp(id)));
// ==> 2022-09-22T12:34:56.789Z
```
