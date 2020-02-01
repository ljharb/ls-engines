# ls-engines <sup>[![Version Badge][2]][1]</sup>

[![Build Status][3]][4]
[![dependency status][5]][6]
[![dev dependency status][7]][8]
[![License][license-image]][license-url]
[![Downloads][downloads-image]][downloads-url]

[![npm badge][11]][1]

Determine if your dependency graph's stated "engines" criteria is met.

## Example

```console
> ls-engines
`package.json` found; building ideal tree from package.json...

Valid node version range: ^13 || ^12 || ^11 || ^10 || ^9 || ^8 || ^7 || ^6 || ^5 || ^4 || ^0.12 || ^0.11 || ^0.10 || ^0.9 || ^0.8

Currently available, most recent, valid node major versions: v13.7, v12.14.1, v11.15, v10.18.1, v9.11.2, v8.17, v7.10.1, v6.17.1, v5.12, v4.9.1, v0.12.18, v0.11.16, v0.10.48, v0.9.12, v0.8.28

Current node version, v13.7.0, is valid!
```

`ls-engines` takes a `--mode` option, which defaults to "auto", but can also be "actual", "virtual", or "ideal". ”actual“ reads from `node_modules`; ”virtual“ reads from a lockfile; “ideal” reads from `package.json`.

[1]: https://npmjs.org/package/ls-engines
[2]: http://versionbadg.es/ljharb/ls-engines.svg
[3]: https://travis-ci.com/ljharb/ls-engines.svg
[4]: https://travis-ci.com/ljharb/ls-engines
[5]: https://david-dm.org/ljharb/ls-engines.svg
[6]: https://david-dm.org/ljharb/ls-engines
[7]: https://david-dm.org/ljharb/ls-engines/dev-status.svg
[8]: https://david-dm.org/ljharb/ls-engines?type=dev
[11]: https://nodei.co/npm/ls-engines.png?downloads=true&stars=true
[license-image]: https://img.shields.io/npm/l/ls-engines.svg
[license-url]: LICENSE
[downloads-image]: https://img.shields.io/npm/dm/ls-engines.svg
[downloads-url]: https://npm-stat.com/charts.html?package=ls-engines
