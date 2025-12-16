'use strict';

const colors = require('colors/safe');
const fromEntries = require('object.fromentries');
const groupBy = require('object.groupby');
const { inspect } = require('util');

const EXITS = require('./exit-codes');
const table = require('./table');

function isSubset(inner, outer) {
	const outerS = new Set(outer);
	return inner.every((item) => outerS.has(item));
}

function getDisplayEngines(engines, useDevEngines) {
	return useDevEngines
		? { runtime: { name: 'node', version: engines.node } }
		: engines;
}

function makeSaveFunction(engines, useDevEngines) {
	return function save(pkg) {
		if (useDevEngines) {
			// eslint-disable-next-line no-param-reassign
			pkg.devEngines = pkg.devEngines || {};
			// eslint-disable-next-line no-param-reassign
			pkg.devEngines.runtime = { name: 'node', version: engines.node };
		} else {
			// eslint-disable-next-line no-param-reassign
			pkg.engines = { ...pkg.engines, ...engines };
		}
	};
}

function analyzeEngines(selectedEngines, rootEngines, rootValids, graphValids, graphAllowed) {
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

			conflicting[engine] = Object.entries(groupBy(packageInvalids, ([name]) => name)).map(([
				name,
				results,
			]) => [
				name,
				Array.from(new Set(results.flatMap(([, depEngines]) => depEngines))).join('\n'),
			]);

			if (graphIsSubsetOfRoot) {
				superset.push(engine);
			} else if (rootIsSubsetOfGraph) {
				subset.push(engine);
			}
		}
	});

	return { allOmitted, allStar, anyOmitted, anyStar, conflicting, same, subset, superset };
}

function getImplicitMessage(enginesField, allOmitted, anyOmitted, allStar, anyStar) {
	if (allOmitted) {
		return `\nYour “${enginesField}” field is missing! Prefer explicitly setting a supported engine range.`;
	}
	if (anyOmitted) {
		return `\nYour “${enginesField}” field has some of your selected engines missing! Prefer explicitly setting a supported engine range.`;
	}
	if (allStar) {
		return `\nYour “${enginesField}” field has your selected engines set to \`*\`! Prefer explicitly setting a supported engine range.`;
	}
	if (anyStar) {
		return `\nYour “${enginesField}” field has some of your selected engines set to \`*\`! Prefer explicitly setting a supported engine range.`;
	}
	return null;
}

module.exports = async function checkEngines(
	selectedEngines,
	rootEngines,
	rootValids,
	graphValids,
	graphAllowed,
	graphRanges,
	shouldSave,
	useDevEngines,
) {
	const engineEntries = selectedEngines.map((engine) => [engine, '*'])
		.concat(Object.entries(graphRanges).map(([engine, { displayRange }]) => [engine, displayRange]))
		.filter(([engine, displayRange]) => engine === 'node' || displayRange !== '*');
	const engines = fromEntries(engineEntries);

	const enginesField = useDevEngines ? 'devEngines' : 'engines';
	const displayEngines = getDisplayEngines(engines, useDevEngines);
	const saveEngines = makeSaveFunction(engines, useDevEngines);
	const fixMessage = shouldSave
		? `\n\`${colors.gray('ls-engines')}\` will automatically fix this, per the \`${colors.gray('--save')}\` option, by adding the following to your \`${colors.gray('package.json')}\`:`
		: `\nYou can fix this by running \`${colors.bold(colors.gray('ls-engines --save'))}\`, or by manually adding the following to your \`${colors.gray('package.json')}\`:`;

	const {
		allOmitted,
		allStar,
		anyOmitted,
		anyStar,
		conflicting,
		same,
		subset,
		superset,
	} = analyzeEngines(selectedEngines, rootEngines, rootValids, graphValids, graphAllowed);

	const message = getImplicitMessage(enginesField, allOmitted, anyOmitted, allStar, anyStar);
	if (message) {
		throw {
			code: EXITS.IMPLICIT,
			output: [
				colors.bold(colors.red(message)),
				fixMessage,
				colors.blue(`"${enginesField}": ${JSON.stringify(displayEngines, null, 2)}`),
			],
			save: saveEngines,
		};
	}

	if (same.length === selectedEngines.length) {
		return {
			output: [
				colors.bold(colors.green(`\nYour “${enginesField}” field exactly matches your dependency graph’s requirements!`)),
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
				colors.bold(colors[superset.length > 0 ? 'yellow' : 'green'](`\nYour “${enginesField}” field allows ${superset.length > 0 ? 'more' : 'fewer'} node versions than your dependency graph does.`)),
				conflictingTable,
				process.env.DEBUG ? table([].concat(
					[['Graph deps', 'engines'].map((x) => colors.bold(colors.gray(x)))],
					graphAllowed.map(([a, b]) => [colors.blue(a), inspect(b, { depth: Infinity, maxArrayLength: null })]),
				)) : [],
				expandMessage,
				colors.blue(`"${enginesField}": ${JSON.stringify(displayEngines, null, 2)}`),
			),
			save: saveEngines,
		};
		if (result.code !== EXITS.SUCCESS) {
			throw result;
		}
		return result;
	}
	throw {
		code: EXITS.INEXACT,
		output: [
			colors.red(`\nYour “${enginesField}” field does not exactly match your dependency graph’s requirements!`),
			fixMessage,
			colors.blue(`"${enginesField}": ${JSON.stringify(displayEngines, null, 2)}`),
			process.env.DEBUG ? table([].concat(
				[['Graph deps', 'engines'].map((x) => colors.bold(colors.gray(x)))],
				graphAllowed.map(([a, b]) => [colors.blue(a), inspect(b, { depth: Infinity, maxArrayLength: null })]),
			)) : [],
		],
		save: saveEngines,
	};
};
