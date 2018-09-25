# Pre-releases

## v0.3.1

- Add details about the TypeScript implementation of the protocol
- Fix off-by-one error in protocol documentation ([#8](https://github.com/brannondorsey/chattervox/issues/8))
- Add [FAQ](FAQ.md) ([#5](https://github.com/brannondorsey/chattervox/issues/5))
- Only supporting linux for now (this was always true, but now we are making it explicit)
- Add `pkg.sh` script, run by `npm run pkg`
- Add test coverage with istanbul/nyc and coveralls
- Add continuous integration with Travis CI

## v0.3.0

- Add `config.validate()`.
- Add appropriate `--config` handling ([#4](https://github.com/brannondorsey/chattervox/issues/4)).
- Fix several bugs dealing with loading config files.
- Add `utils.isSSID()`.
- Modify `utils.isCallsign()` to check if callsign is between 1 and 6 characters.
- Add utils and config tests.

## v0.2.2

- Fix `showkey` bug that caused crash if the optional callsign parameter wasn't provided.

## v0.2.1

- Add GPLv3.txt

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