'use strict';

/** @import { SemVerString } from './getAllVersions' */

const Semver = require('semver');

const { values } = Object;

/** @type {(x: unknown) => x is string} */
function isString(x) {
	return typeof x === 'string';
}

/** @type {import('./getLatestMajors')} */
module.exports = function getLatestMajors(versions, validRange = new Semver.Range('*')) {
	const versionsByMajor = versions.reduce((map, v) => {
		const major = Semver.major(v);
		const key = major === 0 ? `${major}.${Semver.minor(v)}` : String(major);
		if (!map[key]) {
			map[key] = [];
		}
		map[key][map[key].length] = v;
		return map;
	}, /** @type {{ [key: string]: SemVerString[] }} */ ({}));
	return values(versionsByMajor)
		.map((vs) => Semver.maxSatisfying(vs, validRange))
		.filter(isString)
		.sort((a, b) => -Semver.compare(a, b));
};
