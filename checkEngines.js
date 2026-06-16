'use strict';

const { inspect, styleText } = require('util');

const EXITS = require('./exit-codes');
const table = require('./table');

const {
	entries,
	fromEntries,
	groupBy,
} = Object;

/**
 * @import { ValidEngine } from './validEngines'
 * @import { EnginesRecord } from './validVersionsForEngines'
 * @import { VersionsByEngine, SemVerString } from './getAllVersions'
 * @import { GraphAllowedEntry } from './getGraphValids'
 * @import { SaveFunction } from './checkEngines'
 * @import { RangeInfo } from './getLatestEngineMajors'
 */

/** @type {(inner: SemVerString[], outer: SemVerString[]) => boolean} */
function isSubset(inner, outer) {
	const outerS = new Set(outer);
	return inner.every((item) => outerS.has(item));
}

/** @param {EnginesRecord} engines @param {boolean} useDevEngines */
function getDisplayEngines(engines, useDevEngines) {
	return useDevEngines
		? { runtime: { name: 'node', version: engines.node } }
		: engines;
}

/** @param {EnginesRecord} engines @param {boolean} useDevEngines */
function makeSaveFunction(engines, useDevEngines) {
	/** @type {SaveFunction} */
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

/**
 * @param {readonly ValidEngine[]} selectedEngines
 * @param {EnginesRecord} rootEngines
 * @param {VersionsByEngine} rootValids
 * @param {VersionsByEngine} graphValids
 * @param {GraphAllowedEntry[]} graphAllowed
 **/
function analyzeEngines(selectedEngines, rootEngines, rootValids, graphValids, graphAllowed) {
	let allOmitted = true;
	let anyOmitted = false;
	let allStar = true;
	let anyStar = false;
	/** @type {string[]} */ const same = [];
	/** @type {string[]} */ const subset = [];
	/** @type {string[]} */ const superset = [];
	/** @type {[ValidEngine, [string, string][]][]} */
	const conflictingEntries = [];

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
			same[same.length] = engine;
			conflictingEntries[conflictingEntries.length] = [engine, []];
		} else {
			const packageInvalids = graphAllowed
				.filter(([, , { [engine]: vs }]) => !rootValids[engine].every((v) => vs.includes(v)))
				.map(([name, depEngines, { [engine]: vs }]) => /** @type {const} */ ([
					name,
					depEngines[engine],
					rootValids[engine].filter((v) => !vs.includes(v)),
				]))
				.sort(([a], [b]) => a.localeCompare(b));

			conflictingEntries[conflictingEntries.length] = [
				engine,
				entries(
					/** @type {{ [k: string]: typeof packageInvalids }} */
					(groupBy(packageInvalids, ([name]) => name)),
				).map(([
					name,
					results,
				]) => [
					name,
					Array.from(new Set(results.flatMap(([, depEngines]) => depEngines))).join('\n'),
				]),
			];

			if (graphIsSubsetOfRoot) {
				superset[superset.length] = engine;
			} else if (rootIsSubsetOfGraph) {
				subset[subset.length] = engine;
			}
		}
	});

	const conflicting = fromEntries(conflictingEntries);

	return {
		allOmitted,
		allStar,
		anyOmitted,
		anyStar,
		conflicting,
		same,
		subset,
		superset,
	};
}

/**
 * @param {string} enginesField
 * @param {boolean} allOmitted
 * @param {boolean} anyOmitted
 * @param {boolean} allStar
 * @param {boolean} anyStar
 **/
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

/** @type {import('./checkEngines')} */
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
	// TODO: when https://github.com/microsoft/TypeScript/issues/41173 / https://github.com/microsoft/TypeScript/issues/59497
	// are fixed, move the destructuring to the signature, and inline `filterer`
	/** @type {<T>(entry: readonly [T, RangeInfo | undefined]) => entry is [T, RangeInfo]} */
	const filterer = (entry) => {
		const [, v] = entry;
		return !!v;
	};
	const engineEntries = selectedEngines.map((engine) => /** @type {[string, string]} */ ([engine, '*']))
		.concat(entries(graphRanges).filter(filterer).map(([
			engine,
			{ displayRange },
		]) => /** @type {const} */ ([
			engine,
			displayRange,
		])))
		.filter(([engine, displayRange]) => engine === 'node' || displayRange !== '*');
	const engines = fromEntries(engineEntries);

	const enginesField = useDevEngines ? 'devEngines' : 'engines';
	const displayEngines = getDisplayEngines(engines, useDevEngines);
	const saveEngines = makeSaveFunction(engines, useDevEngines);
	const fixMessage = shouldSave
		? `\n\`${styleText('gray', 'ls-engines')}\` will automatically fix this, per the \`${styleText('gray', '--save')}\` option, by adding the following to your \`${styleText('gray', 'package.json')}\`:`
		: `\nYou can fix this by running \`${styleText(['bold', 'gray'], 'ls-engines --save')}\`, or by manually adding the following to your \`${styleText('gray', 'package.json')}\`:`;

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
				styleText(['bold', 'red'], message),
				fixMessage,
				styleText('blue', `"${enginesField}": ${JSON.stringify(displayEngines, null, 2)}`),
			],
			save: saveEngines,
		};
	}

	if (same.length === selectedEngines.length) {
		return {
			output: [
				styleText(['bold', 'green'], `\nYour “${enginesField}” field exactly matches your dependency graph’s requirements!`),
			],
		};
	}

	if (superset.length > 0 || subset.length > 0) {
		const expandMessage = shouldSave
			? `\n\`${styleText('gray', 'ls-engines')}\` will automatically ${superset.length > 0 ? 'narrow' : 'widen'} your support, per the \`${styleText('gray', '--save')}\` option, by adding the following to your \`${styleText('gray', 'package.json')}\`:`
			: `\nIf you want to ${superset.length > 0 ? 'narrow' : 'widen'} your support, you can run \`${styleText(['bold', 'gray'], 'ls-engines --save')}\`, or manually add the following to your \`${styleText('gray', 'package.json')}\`:`;

		const conflictingTable = conflicting.node.length > 0 ? `\n${table(/** @type {string[][]} */ ([]).concat(
			[[`Conflicting dependencies (${conflicting.node.length})`, 'engines.node'].map((x) => styleText(['bold', 'gray'], x))],
			conflicting.node.map(([name, range]) => [name, range].map((x) => styleText('gray', x))),
		))}` : [];

		const result = {
			code: superset.length > 0 ? EXITS.INEXACT : EXITS.SUCCESS,
			output: /** @type {string[]} */ ([]).concat(
				styleText(['bold', superset.length > 0 ? 'yellow' : 'green'], `\nYour “${enginesField}” field allows ${superset.length > 0 ? 'more' : 'fewer'} node versions than your dependency graph does.`),
				conflictingTable,
				process.env.DEBUG ? table(/** @type {string[][]} */ ([]).concat(
					[['Graph deps', 'engines'].map((x) => styleText(['bold', 'gray'], x))],
					graphAllowed.map(([a, b]) => [styleText('blue', a), inspect(b, { depth: Infinity, maxArrayLength: null })]),
				)) : [],
				expandMessage,
				styleText('blue', `"${enginesField}": ${JSON.stringify(displayEngines, null, 2)}`),
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
			styleText('red', `\nYour “${enginesField}” field does not exactly match your dependency graph’s requirements!`),
			fixMessage,
			styleText('blue', `"${enginesField}": ${JSON.stringify(displayEngines, null, 2)}`),
			process.env.DEBUG ? table(/** @type {string[][]} */ ([]).concat(
				[['Graph deps', 'engines'].map((x) => styleText(['bold', 'gray'], x))],
				graphAllowed.map(([a, b]) => [styleText('blue', a), inspect(b, { depth: Infinity, maxArrayLength: null })]),
			)) : [],
		],
		save: saveEngines,
	};
};
