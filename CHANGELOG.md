# Pre-releases

## v0.2.0

- Add direct message support with `@KC3LZO` ([#2](https://github.com/brannondorsey/chattervox/issues/2))
- Remove `test/Messenger.test.js`

## v0.1.0

- Add ssid support.
- Add limited callsign validation.
- Add callsign related utility functions in `src/utils.ts`
- Several methods now accept callsigns as `strings` or `Packet.Station` objects.
- Add `Packet.Station` interface.
- Remove `nick` from config.
- Add `ssid` to config (`0` by default).
- Config version bump to 2.
- Relicense under GPL v3 (previously MIT).
- Add `.npmignore`.
- Add `CHANGELOG.md`.

## v0.0.2

- Add `#!/usr/bin/env node` shebang to `src/main.ts` so that `chattervox` installed by npm would run properly.

## v0.0.1

- Initial release. Probably buggy as all get out.