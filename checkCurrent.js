'use strict';

const chalk = require('chalk');

const EXITS = require('./exit-codes');
const table = require('./table');

function isString(x) {
	return typeof x === 'string';
}

const currentVersions = {
	node: process.version,
};

module.exports = async function checkCurrent(selectedEngines, rootValids, graphValids) {
	if (!Array.isArray(selectedEngines) || !selectedEngines.every(isString)) {
		throw new TypeError('`selectedEngines` must be an array of strings');
	}
	let anyInvalid = false;
	const rows = await Promise.all(selectedEngines.map(async (engine) => {
		const currentVersion = currentVersions[engine];
		const rootValid = rootValids[engine].includes(currentVersion);
		const graphValid = graphValids[engine].includes(currentVersion);
		if (!rootValid || !graphValid) {
			anyInvalid = true;
		}
		return [
			chalk.blue(engine),
			`${chalk.blue(chalk.bold(currentVersion))}`,
			`${chalk.bold(rootValid ? chalk.greenBright('yes') : chalk.red('no'))}!`,
			`${chalk.bold(graphValids ? chalk.greenBright('yes') : chalk.red('no'))}!`,
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
			].map((x) => chalk.bold(chalk.gray(x))),
			...rows,
		]).trim(),
	];

	if (anyInvalid) {
		// eslint-disable-next-line no-throw-literal
		throw {
			code: EXITS.CURRENT,
			output,
		};
	}
	return {
		output,
	};
};
