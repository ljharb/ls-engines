'use strict';

const colors = require('colors/safe');

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
			colors.blue(engine),
			`${colors.blue(colors.bold(currentVersion))}`,
			`${colors.bold(rootValid ? colors.green('yes') : colors.red('no'))}!`,
			`${colors.bold(graphValids ? colors.green('yes') : colors.red('no'))}!`,
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
			].map((x) => colors.bold(colors.gray(x))),
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
