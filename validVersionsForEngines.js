'use strict';

const fromEntries = require('object.fromentries');
const satisfies = require('semver/functions/satisfies');

module.exports = async function validVersionsForEngines(engines, allVersions) {
	if (!engines || typeof engines !== 'object' || Array.isArray(engines)) {
		throw new TypeError('`engines` must be an object');
	}
	if (!allVersions || typeof allVersions !== 'object') {
		throw new TypeError('`allVersions` must be an object');
	}

	const entries = Object.entries(allVersions);
	return fromEntries(entries.map(([
		engine,
		versions,
	]) => [
		engine,
		versions.filter((v) => satisfies(v, engines[engine] || '*')),
	]));
};
