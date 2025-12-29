# ls-engines <sup>[![Version Badge][npm-version-svg]][package-url]</sup>

[![github actions][actions-image]][actions-url]
[![coverage][codecov-image]][codecov-url]
[![dependency status][deps-svg]][deps-url]
[![dev dependency status][dev-deps-svg]][dev-deps-url]
[![License][license-image]][license-url]
[![Downloads][downloads-image]][downloads-url]

[![npm badge][npm-badge-png]][package-url]

Determine if your dependency graph's stated "engines" criteria is met.

## Example

```console
> ls-engines
`package.json` found; building ideal tree from package.json...

Valid node version range: ^14 || ^13 || ^12 || ^11 || ^10 || ^9 || ^8 || ^7 || ^6 || ^5 || ^4 || ^0.12 || ^0.11 || ^0.10 || ^0.9 || ^0.8

Currently available, most recent, valid node major versions: v14.2, v13.14, v12.16.3, v11.15, v10.20.1, v9.11.2, v8.17, v7.10.1, v6.17.1, v5.12, v4.9.1, v0.12.18, v0.11.16, v0.10.48, v0.9.12, v0.8.28

Current node version, v13.7.0, is valid!
```

`ls-engines` takes a `--mode` option, which defaults to "auto", but can also be "actual", "virtual", or "ideal". ”actual“ reads from `node_modules`; ”virtual“ reads from a lockfile; “ideal” reads from `package.json`.

[package-url]: https://npmjs.org/package/ls-engines
[npm-version-svg]: https://versionbadg.es/ljharb/ls-engines.svg
[deps-svg]: https://david-dm.org/ljharb/ls-engines.svg
[deps-url]: https://david-dm.org/ljharb/ls-engines
[dev-deps-svg]: https://david-dm.org/ljharb/ls-engines/dev-status.svg
[dev-deps-url]: https://david-dm.org/ljharb/ls-engines#info=devDependencies
[npm-badge-png]: https://nodei.co/npm/ls-engines.png?downloads=true&stars=true
[license-image]: https://img.shields.io/npm/l/ls-engines.svg
[license-url]: LICENSE
[downloads-image]: https://img.shields.io/npm/dm/ls-engines.svg
[downloads-url]: https://npm-stat.com/charts.html?package=ls-engines
[codecov-image]: https://codecov.io/gh/ljharb/ls-engines/branch/main/graphs/badge.svg
[codecov-url]: https://app.codecov.io/gh/ljharb/ls-engines/
[actions-image]: https://img.shields.io/github/check-runs/ljharb/ls-engines/main
[actions-url]: https://github.com/ljharb/ls-engines/actions
