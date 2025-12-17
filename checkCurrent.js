'use strict';

const { styleText } = require('util');

const EXITS = require('./exit-codes');
const table = require('./table');

const currentVersions = {
	node: process.version,
};

module.exports = async function checkCurrent(selectedEngines, rootValids, graphValids) {
	let anyInvalid = false;
	const rows = await Promise.all(selectedEngines.map(async (engine) => {
		const currentVersion = await currentVersions[engine];
		const rootValid = rootValids[engine].includes(currentVersion);
		const graphValid = graphValids[engine].includes(currentVersion);
		if (!rootValid || !graphValid) {
			anyInvalid = true;
		}
		return [
			styleText('blue', engine),
			styleText(['blue', 'bold'], currentVersion),
			`${styleText('bold', styleText(rootValid ? 'green' : 'red', rootValid ? 'yes' : 'no'))}!`,
			`${styleText('bold', styleText(graphValid ? 'green' : 'red', graphValid ? 'yes' : 'no'))}!`,
		];
	}));
	const output = [
		'',
		table([
			[
				'engine',
				'current version',
				'valid (package)',
				'valid (dependency graph)',
			].map((x) => styleText(['bold', 'gray'], x)),
			...rows,
		]).trim(),
	];

	if (anyInvalid) {
		throw {
			code: EXITS.CURRENT,
			output,
		};
	}
	return {
		output,
	};
};
