#!/usr/bin/env node

import { styleText } from 'util';
import pargs from 'pargs';

const {
	entries,
	groupBy,
} = Object;

import validEngines from '#/validEngines';

const {
	errors,
	help,
	tokens,
	values: {
		current,
		dev,
		mode,
		peer,
		production,
		save,
	},
} = await pargs(import.meta.filename, {
	options: {
		current: {
			default: true,
			type: 'boolean',
		},
		dev: {
			default: false,
			type: 'boolean',
		},
		mode: {
			choices: ['auto', 'actual', 'virtual', 'ideal'],
			default: 'auto',
			type: 'enum',
		},
		peer: {
			default: true,
			type: 'boolean',
		},
		production: {
			default: true,
			type: 'boolean',
		},
		save: {
			default: false,
			type: 'boolean',
		},
	},
	tokens: true,
});

// Check if options were explicitly passed (not defaults)
const currentExplicitlyPassed = tokens.some((t) => t.kind === 'option' && (t.name === 'current' || t.name === 'no-current'));
const devExplicitlyPassed = tokens.some((t) => t.kind === 'option' && (t.name === 'dev' || t.name === 'no-dev'));

// Custom validation
if (![dev, production, peer].some(Boolean)) {
	errors[errors.length] = 'At least one of `--dev`, `--production`, or `--peer` must be enabled.';
}
if (dev && devExplicitlyPassed && current && currentExplicitlyPassed) {
	errors[errors.length] = '`--current` is not available when checking dev deps.';
}

await help();

// If we get here, no errors and no --help
const selectedEngines = validEngines;
const effectiveCurrent = dev ? false : current;

import path from 'path';
import Range from 'semver/classes/range.js';
import satisfies from 'semver/functions/satisfies.js';
import major from 'semver/functions/major.js';
import minor from 'semver/functions/minor.js';
import fastArrayIntersect from 'fast_array_intersect';
const intersect = fastArrayIntersect.default || fastArrayIntersect;
import jsonFile from 'json-file-plus';

import EXITS from './exit-codes.js';
import checkCurrent from './checkCurrent.js';
import checkEngines from './checkEngines.js';
import getGraphEntries from './getGraphEntries.js';
import getGraphValids from './getGraphValids.js';
import getLatestEngineMajors from './getLatestEngineMajors.js';
import processFulfilledResults from './processFulfilledResults.js';
import table from './table.js';
import validVersionsForEngines from './validVersionsForEngines.js';
import getAlVersions from './getAllVersions.js';

const {
	fromEntries,
	values,
} = Object;

const pPackage = jsonFile(path.join(process.cwd(), 'package.json'));

/** @type {(ver: string) => string} */
function caret(ver) {
	return `^${ver.replace(/^v/g, '')}`;
}

const pAllVersions = getAlVersions(selectedEngines);

/** @typedef {typeof selectedEngines[number]} ValidEngine */
/** @typedef {{ name: ValidEngine; version?: string | null }} Runtime */
/** @typedef {{ runtime?: Runtime | Runtime[] }} DevEngines */
/** @typedef {Record<ValidEngine, string | null>} Engines */
/** @typedef {{ private?: boolean; devEngines?: DevEngines; engines?: Engines }} PackageData */

/** @import { FulfilledCheckResult, JSONFileLike } from './processFulfilledResults.js' */

const pRootRanges = Promise.all([pPackage, pAllVersions]).then(async ([
	{ data },
	allVersions,
]) => {
	const {
		private: isPrivate,
		devEngines, engines:
		prodEngines,
	} = /** @type {PackageData} */ (data);
	const devEnginesRuntime = devEngines?.runtime;
	// For private packages, devEngines takes precedence over engines (if present)
	const useDevEngines = isPrivate && devEnginesRuntime;
	const engineEntries = validEngines.map((engine) => {
		if (useDevEngines) {
			// devEngines.runtime is an object with name and version (or an array of such)
			const runtimes = /** @type {Runtime[]} */ ([]).concat(devEnginesRuntime);
			const nodeRuntime = runtimes.find((r) => r.name === 'node');
			const version = nodeRuntime?.version || null;
			return [engine, version?.replace(/[=](?<digits>\d)/, '= $<digits>') || null];
		}
		return [
			engine,
			(prodEngines?.[engine] || null)?.replace(/[=](?<digits>\d)/, '= $<digits>'),
		];
	});
	const engines = fromEntries(engineEntries);
	const rangeEntries = engineEntries.map(([engine, v]) => [engine, new Range(v || '*')]);
	const ranges = fromEntries(rangeEntries);
	const valids = await validVersionsForEngines(engines, allVersions);
	return { engines, ranges, useDevEngines, valids };
});

/** @type {(v: string) => string} */
function dropPatch(v) {
	const num = v.replace(/^v/, '');
	return `^${major(num)}.${minor(num)}`;
}

/** @type {(prev: string[], v: string) => string[]} */
function versionReducer(prev, v) {
	if (prev.length === 0) {
		return [v];
	}
	return satisfies(v, caret(prev[prev.length - 1])) ? prev : prev.concat(v);
}

const pGraphRanges = Promise.all([
	getGraphEntries({
		dev,
		mode,
		peer,
		production,
		selectedEngines,
	}),
	pAllVersions,
]).then(async ([graphEntries, allVersions]) => {
	const { valids: graphValids, allowed } = await getGraphValids(graphEntries, allVersions);
	const graphRanges = entries(graphValids).map(([engine, versions]) => {
		const validMajorRanges = graphEntries.length > 0 && versions.length > 0 ? versions.reduceRight(versionReducer, []).map(dropPatch).reverse() : ['*'];
		const lastMajor = validMajorRanges[validMajorRanges.length - 1];
		const greaterThanLowest = lastMajor === '*' ? lastMajor : `>= ${lastMajor.replace(/^\^/, '')}`;
		const validRange = versions.every((v) => satisfies(v, greaterThanLowest))
			? new Range(greaterThanLowest)
			: new Range(validMajorRanges.join(' || '));
		if (!versions.every((v) => validRange.test(v))) {
			throw new RangeError(`please report this: ${engine}: ${versions.join(',')} / ${validRange}`);
		}

		const displayRange = validRange.raw && validRange.raw.replace(/(?:\.0)+(?<spacing> |$)/g, '$<spacing>').split(' ').join(' ');
		return [engine, { displayRange, validRange }];
	});

	const engineEntries = graphRanges.map(([engine, x]) => [engine, /** @type {{ displayRange: string }} */ (x).displayRange]);

	const engines = fromEntries(engineEntries);

	const validEntries = await Promise.all(validEngines.map(async (engine) => {
		const validForEngine = await validVersionsForEngines(engines, allVersions);
		return [engine, validForEngine[engine]];
	}));

	const ranges = fromEntries(graphRanges);
	const valids = fromEntries(validEntries);

	return {
		allowed,
		engines,
		ranges,
		valids,
	};
});

const pLatestEngineMajors = Promise.all([
	pRootRanges,
	pGraphRanges,
	pAllVersions,
]).then(([
	{ ranges: rootRanges },
	{ ranges: graphRanges },
	allVersions,
]) => getLatestEngineMajors(selectedEngines, allVersions, rootRanges, graphRanges));

/** @type {(array: string[], limit: number) => string} */
function wrapCommaSeparated(array, limit) {
	const str = array.join(', ');
	if (str.length <= limit) {
		return str;
	}

	return array.reduce((lines, version) => {
		const lastLine = lines.pop();
		const possibleLine = lastLine ? `${lastLine}, ${version}` : version;
		if (possibleLine.length <= limit) {
			return lines.concat(possibleLine);
		}
		return lines.concat(lastLine || [], version);
	}, /** @type {string[]} */ ([])).map((x) => x.split(',').map((y) => styleText('blue', y)).join(',')).join(',\n');
}

/** @type {(engines: Engines) => Record<string, string>} */
function normalizeEngines(engines) {
	const engineEntries = entries(engines)
		.flatMap(([engine, version]) => (
			engine === 'node' || version !== '*'
				? [[engine, version || '*']]
				: []
		))
		.toSorted(([a], [b]) => a.localeCompare(b));
	return fromEntries(engineEntries);
}

const majorsHeading = 'Currently available latest release of each valid major version:';

/** @type {(engine: unknown) => engine is ValidEngine} */
function isValidEngine(engine) {
	return selectedEngines.includes(/** @type {ValidEngine} */ (engine));
}

const pSummary = Promise.all([
	pRootRanges,
	pGraphRanges,
	pLatestEngineMajors,
]).then(([
	{ engines: rootEngines, useDevEngines },
	{ engines: graphEngines, valids: graphValids },
	latestEngineMajors,
]) => {
	const enginesField = useDevEngines ? 'devEngines' : 'engines';
	/** @type {DevEngines} */
	const displayRootEngines = useDevEngines
		? { runtime: { name: ('node'), version: rootEngines.node } }
		: normalizeEngines(rootEngines);
	return {
		output: /** @type {string[]} */ ([]).concat(
			table([
				[
					'engine',
					majorsHeading,
				].map((x) => styleText(['bold', 'gray'], x)),
				...entries(latestEngineMajors)
					.flatMap(([
						engine,
						{ root, graph },
					]) => (
						isValidEngine(engine)
							? [[
								styleText('blue', engine),
								wrapCommaSeparated(
									graph.length > 0
										? intersect([root, graph])
										: root,
									majorsHeading.length,
								),
							]]
							: []
					)),
			]),
			table([
				/** @type {string[]} */ ([]).concat(
					`package ${enginesField}:`,
					'dependency graph engines:',
				).map((x) => styleText(['bold', 'gray'], x)),
				[
					`"${enginesField}": ${JSON.stringify(displayRootEngines, null, 2)}`,
					values(graphValids).some((x) => x.length > 0) && values(graphEngines).length > 0
						? `"engines": ${JSON.stringify(normalizeEngines(graphEngines), null, 2)}`
						: 'N/A',
				].map((x) => styleText('blue', x)),
			]),
		),
	};
});

Promise.all([
	pGraphRanges,
	pPackage,
	pRootRanges,
	pAllVersions,
]).then(async ([
	{
		allowed: graphAllowed,
		valids: graphValids,
		ranges: graphDisplayRanges,
	},
	pkg,
	{
		engines: rootEngines,
		valids: rootValids,
		useDevEngines,
	},
	allVersions,
]) => {
	// Validate devEngines is subset of engines for non-private packages
	const pkgData = /** @type {PackageData} */ (pkg.data);
	const devEnginesRuntime = pkgData.devEngines?.runtime;
	if (!pkgData.private && devEnginesRuntime) {
		const runtimes = /** @type {Runtime[]} */ ([]).concat(devEnginesRuntime);
		const nodeRuntime = runtimes.find((r) => r.name === 'node');
		const devVersion = nodeRuntime?.version || '*';
		const devValids = await validVersionsForEngines({ node: devVersion }, allVersions);

		const rootValidsSet = new Set(rootValids.node);
		if (!devValids.node.every((v) => rootValidsSet.has(v))) {
			throw {
				code: EXITS.DEV_ENGINES,
				output: [
					styleText(['bold', 'red'], '\nYour "devEngines" field is not a subset of your "engines" field!'),
					`\n"engines.node" allows: ${styleText('blue', rootEngines.node || '*')}`,
					`"devEngines.runtime" requires: ${styleText('blue', devVersion)}`,
					'\nEither widen your "engines" field or narrow your "devEngines" field.',
				],
			};
		}
	}

	const pEngines = checkEngines(
		selectedEngines,
		rootEngines,
		rootValids,
		graphValids,
		graphAllowed,
		graphDisplayRanges,
		save,
		/** @type {boolean} */ (useDevEngines),
	);

	const pCurrent = effectiveCurrent
		? checkCurrent(selectedEngines, rootValids, graphValids)
		: { output: [] };

	// print out successes first
	const { fulfilled = [], rejected = [] } = groupBy(
		await Promise.allSettled([pSummary, pEngines, pCurrent]),
		(x) => x.status,
	);

	await processFulfilledResults(
		/** @type {FulfilledCheckResult[]} */
		(fulfilled),
		save,
		/** @type {JSONFileLike} */
		(pkg),
		EXITS,
		console.log,
	);

	// print out failures last
	await rejected.reduce(async (prev, error) => {
		await prev;

		const rejection = /** @type {PromiseRejectedResult} */ (error);
		if (!rejection.reason) {
			throw error;
		}
		const { reason } = rejection;
		const { code, output, save: doSave } = reason;
		if (!output) {
			throw reason;
		}

		if (save && doSave) {
			doSave(pkg.data);
			try {
				await pkg.save();
			} catch {
				process.exitCode = /** @type {number} */ (process.exitCode) | EXITS.SAVE;
			}
		} else {
			process.exitCode = /** @type {number} */ (process.exitCode) | code;
		}
		output.forEach((/** @type {unknown} */ line) => {
			console.error(line);
		});
	}, Promise.resolve());
}).catch((e) => {
	[].concat(e.output || (e && e.stack) || e).forEach((/** @type {unknown} */ line) => {
		console.error(line);
	});
	process.exitCode = /** @type {number} */ (process.exitCode) | (typeof e.code === 'number' ? e.code : EXITS.ERROR);
});
