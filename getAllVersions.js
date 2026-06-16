'use strict';

const { fromEntries } = Object;

const getNodeVersions = require('./get-node-versions');

/** @import { ValidEngine } from './validEngines' */
/** @import { SemVerString } from './getAllVersions' */

const { isArray } = Array;

/** @type {{ [engine in ValidEngine]: () => Promise<SemVerString[]> }} */
const getEngineVersions = {
	node: getNodeVersions,
};

/** @type {import('./getAllVersions')} */
module.exports = async function getAllVersions(selectedEngines) {
	if (!isArray(selectedEngines)) {
		throw new TypeError('`selectedEngines` must be an array');
	}

	const results = await Promise.all(selectedEngines.map((x) => getEngineVersions[x]()));

	return fromEntries(selectedEngines.map((engine, i) => /** @type {const} */ ([
		engine,
		results[i],
	])));
};
