'use strict';

const colors = require('colors/safe');
const fromEntries = require('object.fromentries');
const group = require('array.prototype.group');

const EXITS = require('./exit-codes');
const table = require('./table');

function isSubset(inner, outer) {
	const outerS = new Set(outer);
	return inner.every((item) => outerS.has(item));
}

module.exports = async function checkEngines(
	selectedEngines,
	rootEngines,
	rootValids,
	graphValids,
	graphAllowed,
	graphRanges,
	shouldSave,
) {
	const engineEntries = selectedEngines.map((engine) => [engine, '*'])
		.concat(Object.entries(graphRanges).map(([engine, { displayRange }]) => [engine, displayRange]))
		.filter(([engine, displayRange]) => engine === 'node' || displayRange !== '*');
	const engines = fromEntries(engineEntries);

	const fixMessage = shouldSave
		? `\n\`${colors.gray('ls-engines')}\` will automatically fix this, per the \`${colors.gray('--save')}\` option, by adding the following to your \`${colors.gray('package.json')}\`:`
		: `\nYou can fix this by running \`${colors.bold(colors.gray('ls-engines --save'))}\`, or by manually adding the following to your \`${colors.gray('package.json')}\`:`;

	let allOmitted = true;
	let anyOmitted = false;
	let allStar = true;
	let anyStar = false;
	const same = [];
	const subset = [];
	const superset = [];
	const conflicting = {};
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
		const all = new Set(rootValids[engine].concat(graphValids[engine]));
		const isSame = all.size === rootValids[engine].length && all.size === graphValids[engine].length;
		const rootIsSubsetOfGraph = isSubset(rootValids[engine], graphValids[engine]);
		const graphIsSubsetOfRoot = isSubset(graphValids[engine], rootValids[engine]);
		if (isSame) {
			same.push(engine);
			conflicting[engine] = [];
		} else {
			const packageInvalids = graphAllowed
				.filter(([, , { [engine]: vs }]) => !rootValids[engine].every((v) => vs.includes(v)))
				.map(([name, depEngines, { [engine]: vs }]) => [name, depEngines[engine], rootValids[engine].filter((v) => !vs.includes(v))])
				.sort(([a], [b]) => a.localeCompare(b));

			conflicting[engine] = Object.entries(group(packageInvalids, ([name]) => name)).map(([
				name,
				results,
			]) => [
				name,
				Array.from(new Set(results.flatMap(([, depEngines]) => depEngines))).join('\n'),
			]);

			// if (isSubset(rootValids[engine], graphValids[engine])) {
			if (graphIsSubsetOfRoot) {
				superset.push(engine);
			} else if (rootIsSubsetOfGraph) {
				subset.push(engine);
			}
			// }
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
				colors.bold(colors.red(message)),
				fixMessage,
				colors.blue(`"engines": ${JSON.stringify(engines, null, 2)}`),
			],
			save(pkg) {
				// eslint-disable-next-line no-param-reassign
				pkg.engines = { ...pkg.engines, ...engines };
			},
		};
	}

	if (same.length === selectedEngines.length) {
		return {
			output: [
				colors.bold(colors.green('\nYour “engines” field exactly matches your dependency graph’s requirements!')),
			],
		};
	}

	if (superset.length > 0 || subset.length > 0) {
		const expandMessage = shouldSave
			? `\n\`${colors.gray('ls-engines')}\` will automatically ${superset.length > 0 ? 'narrow' : 'widen'} your support, per the \`${colors.gray('--save')}\` option, by adding the following to your \`${colors.gray('package.json')}\`:`
			: `\nIf you want to ${superset.length > 0 ? 'narrow' : 'widen'} your support, you can run \`${colors.bold(colors.gray('ls-engines --save'))}\`, or manually add the following to your \`${colors.gray('package.json')}\`:`;

		const conflictingTable = conflicting.node.length > 0 ? `\n${table([].concat(
			[[`Conflicting dependencies (${conflicting.node.length})`, 'engines.node'].map((x) => colors.bold(colors.gray(x)))],
			conflicting.node.map(([name, range]) => [name, range].map((x) => colors.gray(x))),
		))}` : [];

		const result = {
			code: superset.length > 0 ? EXITS.INEXACT : EXITS.SUCCESS,
			output: [].concat(
				colors.bold(colors[superset.length > 0 ? 'yellow' : 'green'](`\nYour “engines” field allows ${superset.length > 0 ? 'more' : 'fewer'} node versions than your dependency graph does.`)),
				conflictingTable,
				expandMessage,
				colors.blue(`"engines": ${JSON.stringify(engines, null, 2)}`),
			),
			save(pkg) {
				// eslint-disable-next-line no-param-reassign
				pkg.engines = { ...pkg.engines, ...engines };
			},
		};
		if (result.code !== EXITS.SUCCESS) {
			throw result;
		}
		return result;
	}
	throw {
		code: EXITS.INEXACT,
		output: [
			colors.red('\nYour “engines” field does not exactly match your dependency graph‘s requirements!'),
			fixMessage,
			colors.blue(`"engines": ${JSON.stringify(engines, null, 2)}`),
		],
		save(pkg) {
			// eslint-disable-next-line no-param-reassign
			pkg.engines = { ...pkg.engines, ...engines };
		},
	};
};
