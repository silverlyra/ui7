# Changelog

## v0.2.1 _unreleased_

- Fixed the generation of monotonic UUID’s.

## v0.2.0 (2022-09-24)

- Added `bufferedRandom`, which calls `crypto.getRandomBytes` in blocks instead of on every UUID generation call, to improve performance significantly.
- Changed the signature of `EntropySource` to accept the number of desired random bytes.

## v0.1.0 (2022-09-23)

- Initial release
- Wrote the [readme](./README.md)
