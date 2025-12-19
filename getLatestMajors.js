'use strict';

const Semver = require('semver');

const { values } = Object;

function isString(x) {
	return typeof x === 'string';
}

module.exports = function getLatestMajors(versions, validRange = new Semver.Range('*')) {
	const versionsByMajor = versions.reduce((map, v) => {
		const major = Semver.major(v);
		const key = major === 0 ? `${major}.${Semver.minor(v)}` : String(major);
		if (!map[key]) {
			map[key] = [];
		}
		map[key].push(v);
		return map;
	}, {});
	return values(versionsByMajor)
		.map((vs) => Semver.maxSatisfying(vs, validRange))
		.filter(isString)
		.sort((a, b) => -Semver.compare(a, b));
};
