'use strict';

const fromEntries = require('object.fromentries');

const getLatestMajors = require('./getLatestMajors');

module.exports = async function getLatestEngineMajors(
	selectedEngines,
	allVersions,
	rootRanges,
	graphRanges,
) {
	const majorEntries = await Promise.all(selectedEngines.map(async (engine) => {
		const { validRange: rootRange } = rootRanges[engine];
		const { validRange: graphRange } = graphRanges[engine] || {};
		const versions = allVersions[engine];
		const rootMajors = getLatestMajors(versions, rootRange);
		const graphMajors = graphRange ? getLatestMajors(versions, graphRange) : [];
		return [engine, { graph: graphMajors, root: rootMajors }];
	}));
	return fromEntries(majorEntries);
};
