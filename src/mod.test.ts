import test from 'ava';

import uuid, { generator, ParseError, pattern, timestamp } from './mod';

test('generates the RFC example UUID', (t) => {
  const time = 0x17f22e279b0;
  const entropy = () =>
    new Uint8Array([0x0c, 0xc3, 0x18, 0xc4, 0xdc, 0x0c, 0x0c, 0x07, 0x39, 0x8f]);

  t.is(uuid({ time, entropy }), '017f22e2-79b0-7cc3-98c4-dc0c0c07398f');
  t.is(uuid({ time, entropy, dashes: false }), '017f22e279b07cc398c4dc0c0c07398f');
  t.is(uuid({ time, entropy, upper: true }), '017F22E2-79B0-7CC3-98C4-DC0C0C07398F');
  t.is(uuid({ time, entropy, version: 8 }), '017f22e2-79b0-8cc3-98c4-dc0c0c07398f');
});

test('generates distinct UUIDs', (t) => {
  const a = uuid();
  const b = uuid();

  t.is(pattern.test(a), true);
  t.is(pattern.test(b), true);
  t.not(a, b);
});

test('generates UUIDs with the current timestamp', (t) => {
  const [now, id] = [Date.now(), uuid()];

  t.is(timestamp(id), now);
});

test('generates monotonic UUIDs', (t) => {
  const uuid = generator({ time: () => 0 });

  const ids = [...Array(2 ** 11)].map(uuid);
  t.is(pattern.test(ids[0]), true);

  const sorted = [...ids].sort();
  t.deepEqual(ids, sorted);
});

test('parses the timestamp field', (t) => {
  t.is(timestamp('017f22e2-79b0-7cc3-98c4-dc0c0c07398f'), 0x17f22e279b0);
  t.is(timestamp('017F22E2-79B0-7CC3-98C4-DC0C0C07398F'), 0x17f22e279b0);
  t.is(timestamp('017f22e279b07cc398c4dc0c0c07398f'), 0x17f22e279b0);
  t.is(timestamp('017F22E279B07CC398C4DC0C0C07398F'), 0x17f22e279b0);

  t.throws(() => timestamp('ea761762-3b05-11ed-a261-0242ac120002'), {
    instanceOf: ParseError,
  });
  t.throws(() => timestamp('0cddf0a0-d1b3-4688-8a11-c845855caa95'), {
    instanceOf: ParseError,
  });
  t.throws(() => timestamp('017f22e2-79b0-7'), {
    instanceOf: ParseError,
  });
});

test('matches the RFC example UUID', (t) => {
  t.is(pattern.test('017f22e2-79b0-7cc3-98c4-dc0c0c07398f'), true);
  t.is(pattern.test('017F22E2-79B0-7CC3-98C4-DC0C0C07398F'), true);
  t.is(pattern.test('017f22e279b07cc398c4dc0c0c07398f'), true);
  t.is(pattern.test('017F22E279B07CC398C4DC0C0C07398F'), true);

  // containing an invalid character
  t.is(pattern.test('017f22e2-79b0-7cc3-98c4-dc0c0c07398z'), false);
  t.is(pattern.test('017F22E2-79B0-7CC3-98C4-DC0C0C07398Z'), false);
  t.is(pattern.test('017f22e279b07cc398c4dc0c0c07398z'), false);
  t.is(pattern.test('017F22E279B07CC398C4DC0C0C07398Z'), false);

  // too long
  t.is(pattern.test('017f22e2-79b0-7cc3-98c4-dc0c0c07398fa'), false);
  t.is(pattern.test('017F22E2-79B0-7CC3-98C4-DC0C0C07398Fa'), false);
  t.is(pattern.test('017f22e279b07cc398c4dc0c0c07398fa'), false);
  t.is(pattern.test('017F22E279B07CC398C4DC0C0C07398Fa'), false);

  // too short
  t.is(pattern.test('017f22e2-79b0-7cc3-98c4-dc0c0c07398'), false);
  t.is(pattern.test('017F22E2-79B0-7CC3-98C4-DC0C0C07398'), false);
  t.is(pattern.test('017f22e279b07cc398c4dc0c0c07398'), false);
  t.is(pattern.test('017F22E279B07CC398C4DC0C0C07398'), false);
});
