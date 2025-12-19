'use strict';

const { fromEntries } = Object;

const getNodeVersions = require('./get-node-versions');

const getEngineVersions = {
	node: getNodeVersions,
};

module.exports = async function getAllVersions(selectedEngines) {
	if (!Array.isArray(selectedEngines)) {
		throw new TypeError('`selectedEngines` must be an array');
	}

	const results = await Promise.all(selectedEngines.map((x) => getEngineVersions[x]()));

	return fromEntries(selectedEngines.map((engine, i) => [engine, results[i]]));
};
