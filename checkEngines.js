'use strict';

const chalk = require('chalk');
const fromEntries = require('object.fromentries');

const EXITS = require('./exit-codes');

function isSubset(inner, outer) {
	const outerS = new Set(outer);
	return inner.every((item) => outerS.has(item));
}

module.exports = async function checkEngines(
	selectedEngines,
	rootEngines,
	rootValids,
	graphValids,
	graphRanges,
	shouldSave,
) {
	/* eslint no-throw-literal: 0 */

	const engineEntries = Object.entries(graphRanges).map(([engine, { displayRange }]) => [engine, displayRange]);
	const engines = fromEntries(engineEntries);

	const fixMessage = shouldSave
		? `\n\`${chalk.gray('ls-engines')}\` will automatically fix this, per the \`${chalk.gray('--save')}\` option, by adding the following to your \`${chalk.gray('package.json')}\`:`
		: `\nYou can fix this by running \`${chalk.bold(chalk.gray('ls-engines --save'))}\`, or by manually adding the following to your \`${chalk.gray('package.json')}\`:`;

	let allOmitted = true;
	let anyOmitted = false;
	let allStar = true;
	let anyStar = false;
	const same = [];
	const subset = [];
	selectedEngines.forEach((engine) => {
		const value = rootEngines[engine];
		if (typeof value === 'string') {
			allOmitted = false;
			if (value === '*') {
				anyStar = true;
			} else {
				allStar = false;
			}
		} else {
			anyOmitted = true;
		}
		if (rootValids[engine].length === graphValids[engine].length) {
			same.push(engine);
		} else if (isSubset(rootValids[engine], graphValids[engine])) {
			subset.push(engine);
		}
	});

	let message;
	if (allOmitted) {
		message = '\nYour “engines” field is missing! Prefer explicitly setting a supported engine range.';
	} else if (anyOmitted) {
		message = '\nYour “engines” field has some of your selected engines missing! Prefer explicitly setting a supported engine range.';
	} else if (allStar) {
		message = '\nYour “engines” field has your selected engines set to `*`! Prefer explicitly setting a supported engine range.';
	} else if (anyStar) {
		message = '\nYour “engines” field has some of your selected engines set to `*`! Prefer explicitly setting a supported engine range.';
	}
	if (message) {
		throw {
			code: EXITS.IMPLICIT,
			output: [
				chalk.bold(chalk.red(message)),
				fixMessage,
				chalk.blue(`"engines": ${JSON.stringify(engines, null, 2)}`),
			],
			save(pkg) {
				/* eslint no-param-reassign: 0 */
				pkg.engines = { ...pkg.engines, ...engines };
			},
		};
	}

	if (same.length === selectedEngines.length) {
		return {
			output: [
				chalk.bold(chalk.green('\nYour “engines” field exactly matches your dependency graph’s requirements!')),
			],
		};
	}
	if (subset.length > 0) {
		const expandMessage = shouldSave
			? `\n\`${chalk.gray('ls-engines')}\` will automatically widen your support, per the \`${chalk.gray('--save')}\` option, by adding the following to your \`${chalk.gray('package.json')}\`:`
			: `\nIf you want to widen your support, you can run \`${chalk.bold(chalk.gray('ls-engines --save'))}\`, or manually add the following to your \`${chalk.gray('package.json')}\`:`;
		return {
			output: [
				chalk.bold(chalk.green('\nYour “engines” field allows fewer node versions than your dependency graph does.')),
				expandMessage,
				chalk.blue(`"engines": ${JSON.stringify(engines, null, 2)}`),
			],
			save(pkg) {
				/* eslint no-param-reassign: 0 */
				pkg.engines = { ...pkg.engines, ...engines };
			},
		};
	}
	throw {
		code: EXITS.INEXACT,
		output: [
			chalk.red('\nYour “engines” field does not exactly match your dependency graph‘s requirements!'),
			fixMessage,
			chalk.blue(`"engines": ${JSON.stringify(engines, null, 2)}`),
		],
		save(pkg) {
			/* eslint no-param-reassign: 0 */
			pkg.engines = { ...pkg.engines, ...engines };
		},
	};
};
