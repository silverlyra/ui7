/**
 * Generate a UUIDv7.
 *
 * ## Options
 *
 * To generate a UUID at a specific time, you can pass a `number` timestamp or
 * `Date` object to this function.
 *
 * You can also further customize UUID generation by providing
 * {@link Options an object} with your preferences:
 *
 * - `time`:    Generate with this time instead of the current system time. You can
 *              provide a `number` millisecond-precision UNIX timestamp (as `Date.now`
 *              returns), a Date object, or a function returning a `number` timestamp.
 * - `dashes`:  `true` to include `-` characters in the generated UUID string;
 *              `false` to omit them. (default: `true`)
 * - `upper`:   Capitalize the A-F characters in the UUID. (default: `false`)
 * - `version`: The value of the UUID `version` field (default: `7`)
 * - `entropy`: A {@link EntropySource function} to generate the random part of
 *              the UUID; or `0` or `0xFF` to set all "random" bits in the UUID
 *              uniformly. (default: uses `crypto.getRandomValues`)
 */
export const v7: Generator = (opt?: Clock | Time | Options | null): string => {
  const time = getTime(opt);
  let dashes = true;
  let upper = false;
  let version = 7 << 4;
  let rand: EntropySource = random;

  if (typeof opt === 'object' && opt !== null && !(opt instanceof Date)) {
    if (opt.dashes != null) dashes = opt.dashes;
    if (opt.version != null) version = (opt.version & 0x0f) << 4;
    if (opt.upper != null) upper = opt.upper;
    if (opt.entropy != null)
      rand =
        opt.entropy === 0 || opt.entropy === 0xff
          ? constantEntropy(opt.entropy)
          : opt.entropy;
  }

  let timestamp = hex(time, 12);
  if (dashes) timestamp = timestamp.slice(0, 8) + '-' + timestamp.slice(8);

  const suffixBytes: string[] = Array(10);
  rand(10, time).forEach((b, i) => {
    if (i === 0) {
      b = version | (b & 0x0f);
    } else if (i === 2) {
      b = variant | (b & 0x3f);
    }
    suffixBytes[i] = hex(b);
  });

  const suffix = suffixBytes.join('');

  const id = dashes
    ? `${timestamp}-${suffix.slice(0, 4)}-${suffix.slice(4, 8)}-${suffix.slice(8)}`
    : timestamp + suffix;

  return upper ? id.toUpperCase() : id;

  function constantEntropy(k: EntropyOptions['entropy'] & number): EntropySource {
    return (n) => new Uint8Array(n).map(() => k);
  }
};

export default v7;

/**
 * Create a UUID generator. By default, uses a {@link monotonic} entropy source. Accepts the same options as the default generator.
 */
export const generator = (options?: GeneratorOptions): Generator => {
  options = {
    entropy: monotonic(),
    ...options,
  };

  return (opt?: Clock | Time | Options | null) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    if (opt == null) return v7(options!);

    if (opt instanceof Date || typeof opt === 'number' || typeof opt === 'function')
      return v7({ ...options, time: opt });

    return v7({ ...options, ...opt });
  };
};

/**
 * Return the timestamp portion of the UUID (a millisecond-precision UNIX
 * timestamp, as returned by `Date.now`).
 *
 * Throws a {@link ParseError} if no timestamp can be extracted.
 */
export const timestamp = (uuid: string): number => {
  const match = pattern.exec(uuid);
  if (match == null) throw new ParseError('Invalid v7 UUID; cannot determine timestamp');

  const ts = match[1].replace('-', '');
  return parseInt(ts, 16);
};

/**
 * A regular expression that recognizes UUID's generated by this package.
 *
 * Capture group `1` is the timestamp portion, and `2` is the random portion
 * (including the 2-bit constant UUID variant field).
 */
export const pattern =
  /^([0-9a-f]{8}-?[0-9a-f]{4})-?7([0-9a-f]{3}-?[0-9a-f]{4}-?[0-9a-f]{12})$/i;

/** The type of {@link v7 the UUID function} of this package. */
export interface Generator {
  /** Generate a UUIDv7 with default options. */
  (): string;

  /** Generate a UUIDv7 using the given time as its timestamp. */
  (time: Clock | Time | null | undefined): string;

  /** Generate a UUIDv7 using the given {@link Options options}. */
  (options: Options): string;
}

/**
 * A function that returns a millisecond-precision UNIX timestamp, like
 * `Date.now`.
 */
export type Clock = typeof Date['now'];

/** A `Date` object or millisecond-precision UNIX timestamp. */
export type Time = number | Date;

/** {@link v7 UUID generation} options. */
export interface Options extends EntropyOptions, FormatOptions {
  /**
   * Set the timestamp portion of the UUID to the given `Date`, UNIX timestamp
   * (as returned by `Date.now`), or the timestamp returned by the given
   * {@link Clock clock function}.
   */
  time?: Clock | Time;
}

/** Configures a UUID {@link generator}. */
export interface GeneratorOptions extends EntropyOptions, FormatOptions {
  /** Use a different timestamp source than `Date.now`. */
  time?: Clock;
}

/** Configures how the "random" fields of a generated UUID are populated. */
export interface EntropyOptions {
  /**
   * A {@link EntropySource function} to generate the random part of the UUID;
   * or `0` or `0xFF` to set all "random" bits in the UUID uniformly. (default:
   * uses `crypto.getRandomValues`)
   */
  entropy?: EntropySource | 0 | 0xff;
}

/** Configures how a generated UUID is formatted. */
export interface FormatOptions {
  /**
   * `true` to include dashes in the UUID; `false` to omit them.
   * (default: `true`)
   */
  dashes?: boolean;

  /** Capitalize the A-F characters in the UUID. (default: `false`) */
  upper?: boolean;

  /** Set the version field of the UUID. (default: `7`) */
  version?: 7 | 8;
}

/**
 * A source for the `rand` fields of a UUID. To implement monotonic or other
 * counter-based `rand` fields, the UUID's `timestamp` is provided.
 *
 * Must return a `Uint8Array` of `size` bytes.
 */
export type EntropySource = (size: number, timestamp: number) => Uint8Array;

/**
 * A buffered `EntropySource`. To reduce overhead, `bufferedRandom` calls the
 * underlying `getRandomValues` in chunks of `blockSize`, returning the
 * already-generated random bytes for future reads until the block is exhausted.
 */
export const bufferedRandom = (blockSize = 200): EntropySource => {
  let bytes: Uint8Array | undefined;
  let buffer: ArrayBuffer;
  let pos: number;

  return (size: number) => {
    if (size > blockSize) {
      bytes = undefined;
      blockSize = size;
    }
    if (!bytes) {
      bytes = new Uint8Array(blockSize);
      buffer = bytes.buffer;

      crypto.getRandomValues(bytes);
      pos = 0;
    }

    let next = pos + size;
    if (next >= blockSize) {
      const leftover = blockSize - pos;
      bytes.copyWithin(0, pos);

      crypto.getRandomValues(new Uint8Array(buffer, leftover));
      pos = 0;
      next = size;
    }

    const result = new Uint8Array(buffer, pos, size);
    pos = next;

    return result;
  };
};

/**
 * Fill the UUID's `rand` fields with random bits, using
 * [`getRandomValues`][random]. UUID's produced with this randomness source are
 * not monotonic; ID's produced within the same millisecond will not necessarily
 * be sortable in the order they were produced.
 *
 * [random]: https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues
 */
export const random = bufferedRandom();

/**
 * Return an entropy source that allocates 12 bits as a monotonic counter at the
 * start of the UUIDv7 random fields.
 *
 * When a new timestamp is rolled over, the high bit of this field is set to
 * `0`. In the "unluckiest" case where the initial random counter value is
 * `0x7FF`, 2048 counter values are available within the same (millisecond)
 * timestamp value before exhaustion.
 *
 * **Note:** This package does not currently handle overflow of the counter
 * field; after `0xFFF`, the next value is `0x000`.
 */
export const monotonic = (entropy: EntropySource = random): EntropySource => {
  let bytes = new Uint8Array(10);
  let randomBytes = new Uint8Array(bytes.buffer, 2);

  let lastTimestamp = 0;
  let seq: number | undefined;

  return (size, timestamp) => {
    if (bytes.byteLength !== size) {
      bytes = new Uint8Array(size);
      randomBytes = new Uint8Array(bytes.buffer, 2);
    }

    if (timestamp > lastTimestamp) {
      bytes.set(entropy(10, timestamp));
      bytes[0] &= 0x07;

      lastTimestamp = timestamp;
      seq = undefined;
    } else {
      if (seq === undefined) seq = ((bytes[0] & 0x0f) << 8) | bytes[1];
      seq++; // NOTE: may overflow; will truncate back to 0

      randomBytes.set(entropy(8, timestamp));
      bytes[0] = (seq >> 8) & 0xff;
      bytes[1] = seq & 0xff;
    }

    return bytes;
  };
};

/** The exception thrown by {@link timestamp} if UUID parsing fails. */
export class ParseError extends Error {
  public readonly name = 'ParseError';
}

const getTime = (time: Clock | Time | Options | null | undefined): number => {
  if (time == null) return Date.now();
  if (typeof time === 'number') return time;
  if (time instanceof Date) return +time;
  if (typeof time === 'function') return time();
  return getTime(time.time);
};

const hex = (n: number, width = 2) => n.toString(16).padStart(width, '0');

const variant = 2 << 6;
