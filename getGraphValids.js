'use strict';

const { default: intersect } = require('fast_array_intersect');
const fromEntries = require('object.fromentries');
const compare = require('semver/functions/compare');

const validVersionsForEngines = require('./validVersionsForEngines');

module.exports = async function getGraphValids(graphEntries, allVersions) {
	if (!Array.isArray(graphEntries)) {
		throw new TypeError('`graphEntries` must be an array');
	}
	if (!allVersions || typeof allVersions !== 'object' || Array.isArray(allVersions)) {
		throw new TypeError('`allVersions` must be an object');
	}

	if (graphEntries.length === 0) {
		return {
			allowed: [],
			valids: {},
		};
	}

	const graphAllowed = await Promise.all(graphEntries.map(async ([name, engines]) => [
		name,
		engines,
		await validVersionsForEngines(engines, allVersions),
	]));

	const mergedGraphEngines = graphAllowed.reduce((mergedEngines, [, , engines]) => {
		const entries = Object.entries(engines);
		entries.forEach(([engine, versions]) => {
			if (!Array.isArray(mergedEngines[engine])) {
				mergedEngines[engine] = []; // eslint-disable-line no-param-reassign
			}
			mergedEngines[engine].push(versions);
		});
		return mergedEngines;
	}, {});
	return {
		allowed: graphAllowed,
		valids: fromEntries(Object.entries(mergedGraphEngines).map(([engine, versionArrays]) => {
			const intersection = intersect(versionArrays);
			return [engine, intersection.sort((a, b) => -compare(a, b))];
		})),
	};
};
