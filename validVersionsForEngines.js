'use strict';

const satisfies = require('semver/functions/satisfies');

const {
	fromEntries,
	entries,
} = Object;

module.exports = async function validVersionsForEngines(engines, allVersions) {
	if (!engines || typeof engines !== 'object' || Array.isArray(engines)) {
		throw new TypeError('`engines` must be an object');
	}
	if (!allVersions || typeof allVersions !== 'object') {
		throw new TypeError('`allVersions` must be an object');
	}

	return fromEntries(entries(allVersions).map(([
		engine,
		versions,
	]) => [
		engine,
		versions.filter((v) => satisfies(v, engines[engine] || '*')),
	]));
};
