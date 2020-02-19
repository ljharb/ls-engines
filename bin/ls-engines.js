#!/usr/bin/env node
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const path = require('path');
const Semver = require('semver');
const { default: intersect } = require('fast_array_intersect');
const chalk = require('chalk');
const yargs = require('yargs');
const allSettled = require('promise.allsettled');
const jsonFile = require('json-file-plus');
const fromEntries = require('object.fromentries');
const EXITS = require('../exit-codes');
const table = require('../table');
const getLatestEngineMajors = require('../getLatestEngineMajors');
const checkCurrent = require('../checkCurrent');
const checkEngines = require('../checkEngines');
const FALSE = Object(false);
const TRUE = Object(true);
const { argv } = yargs
    .option('mode', {
    choices: ['auto', 'actual', 'virtual', 'ideal'],
    default: 'auto',
    describe: `”actual“ reads from \`${chalk.gray('node_modules')}\`; ”virtual“ reads from a lockfile; “ideal” reads from \`${chalk.gray('package.json')}\``,
})
    .option('production', {
    default: TRUE,
    describe: 'whether to include production deps or not',
    type: 'boolean',
})
    .option('dev', {
    default: FALSE,
    describe: 'whether to include dev deps or not',
    type: 'boolean',
})
    .option('save', {
    default: false,
    describe: `update \`${chalk.gray('package.json')}\`’s “engines” field to match that of your dependency graph`,
    type: 'boolean',
})
    .option('current', {
    default: true,
    describe: 'check that the current engine version(s) matches your dependency graph’s requirements',
    type: 'boolean',
})
    .check(({ dev, production }) => {
    if (typeof dev === 'boolean' && typeof production === 'boolean') {
        // both arguments were explicitly passed
        if (!dev && !production) {
            // eslint-disable-line no-throw-literal
            throw 'One of `--dev` and `--production` must be enabled.';
        }
    }
    return true;
})
    .strict()
    .help();
function normalize(args) {
    let { dev, production } = args;
    if (typeof dev === 'object' && typeof production === 'object') {
        // neither argument was explicitly passed
        dev = false;
        production = true;
    }
    else if (typeof dev === 'boolean' && typeof production === 'object') {
        // explicitly passed dev/no-dev, did not mention prod
        production = !dev || Boolean.prototype.valueOf.call(production);
    }
    else if (typeof dev === 'object' && typeof production === 'boolean') {
        // explicitly passed production/no-production, did not mention dev
        dev = !production || Boolean.prototype.valueOf.call(dev);
    }
    return { ...args, dev, production };
}
const { current, dev, mode, production, save } = normalize(argv);
const selectedEngines = ['node', 'npm'];
const getTree = require('../get-tree');
const getNodeVersions = require('../get-node-versions');
const getNPMVersions = require('../get-npm-versions');
const pPackage = jsonFile(path.join(process.cwd(), 'package.json'));
const pGraphEntries = getTree(mode, { dev, production }).then(async (tree) => {
    const nodesWithEngines = tree.inventory.filter(({ package: { _inBundle, engines, } }) => !_inBundle && engines && engines.node);
    const tuples = Array.from(nodesWithEngines, ({ name, package: { engines } }) => [name, engines]);
    return tuples.filter(([, { node }]) => node && node !== '*');
});
function caret(ver) {
    return '^' + ver.replace(/^v/g, '');
}
const pAllVersions = Promise.all([
    getNodeVersions(),
    getNPMVersions(),
]).then(([nodeVersions, npmVersions,]) => ({
    node: nodeVersions,
    npm: npmVersions,
}));
async function validVersionsForEngines(engines) {
    const allVersions = await pAllVersions;
    const entries = Object.entries(allVersions);
    return fromEntries(entries.map(([engine, versions,]) => [
        engine,
        versions.filter((v) => Semver.satisfies(v, engines[engine] || '*')),
    ]));
}
async function getGraphValids(graphEntries) {
    if (graphEntries.length === 0) {
        return validVersionsForEngines({ node: '*' });
    }
    const graphAllowed = await Promise.all(graphEntries.map(([, engines]) => validVersionsForEngines(engines)));
    const mergedGraphEngines = graphAllowed.reduce((mergedEngines, engines) => {
        const entries = Object.entries(engines);
        entries.forEach(([engine, versions]) => {
            if (!Array.isArray(mergedEngines[engine])) {
                mergedEngines[engine] = []; // eslint-disable-line no-param-reassign
            }
            mergedEngines[engine].push(versions);
        });
        return mergedEngines;
    }, {});
    const entries = Object.entries(mergedGraphEngines).map(([engine, versionArrays]) => {
        const intersection = intersect(versionArrays);
        return [engine, intersection.sort((a, b) => -Semver.compare(a, b))];
    });
    return fromEntries(entries);
}
const pRootRanges = pPackage.then(async (pkg) => {
    const engineEntries = selectedEngines.map((engine) => [
        engine,
        (pkg.data.engines && pkg.data.engines[engine]) || null,
    ]);
    const engines = fromEntries(engineEntries);
    const rangeEntries = engineEntries.map(([engine, v]) => [engine, new Semver.Range(v || '*')]);
    const ranges = fromEntries(rangeEntries);
    const valids = await validVersionsForEngines(engines);
    return { engines, ranges, valids };
});
function dropPatch(v) {
    const num = v.replace(/^v/, '');
    return `^${Semver.major(num)}.${Semver.minor(num)}`;
}
const pGraphRanges = pGraphEntries.then((async (graphEntries) => {
    const graphValids = await getGraphValids(graphEntries);
    const graphRanges = Object.entries(graphValids).map(([engine, versions]) => {
        const validMajorRanges = graphEntries.length > 0 && versions.length > 0 ? versions.reduceRight((prev, v) => {
            if (prev.length === 0) {
                return [v];
            }
            return Semver.satisfies(v, caret(prev[prev.length - 1])) ? prev : prev.concat(v);
        }, []).map(dropPatch).reverse() : ['*'];
        const lastMajor = validMajorRanges[validMajorRanges.length - 1];
        const greaterThanLowest = lastMajor === '*' ? lastMajor : `>= ${lastMajor.replace(/^\^/, '')}`;
        const validRange = versions.every((v) => Semver.satisfies(v, greaterThanLowest))
            ? new Semver.Range(greaterThanLowest)
            : new Semver.Range(validMajorRanges.join(' || '));
        if (!versions.every((v) => validRange.test(v))) {
            throw new RangeError(`please report this: ${engine}: ${versions.join(',')} / ${validRange}`);
        }
        const displayRange = validRange.raw && validRange.raw.replace(/(\.0)+( |$)/g, '$2').split(' ').join(' ');
        const tuple = [engine, { displayRange, validRange }];
        return tuple;
    });
    const engineEntries = graphRanges.map(([engine, { displayRange }]) => [engine, displayRange]);
    const engines = fromEntries(engineEntries);
    const validEntries = await Promise.all(selectedEngines.map(async (engine) => {
        const validForEngine = await validVersionsForEngines(engines);
        return [engine, validForEngine[engine]];
    }));
    const valids = fromEntries(validEntries);
    return {
        engines,
        ranges: fromEntries(graphRanges),
        valids,
    };
}));
const pLatestEngineMajors = Promise.all([
    pRootRanges,
    pGraphRanges,
    pAllVersions,
]).then(([{ ranges: rootRanges }, { ranges: graphRanges }, allVersions,]) => getLatestEngineMajors(selectedEngines, allVersions, rootRanges, graphRanges));
function wrapCommaSeparated(array, limit) {
    const str = array.join(', ');
    if (str.length <= limit) {
        return str;
    }
    const re = new RegExp(`.{1,${limit}}(?<=(?:,|$)) `, 'g');
    return (str.match(re) || []).map((x) => x).join('\n');
}
const majorsHeading = 'Currently available latest release of each valid major version:';
function normalizeEngines(engines) {
    const entries = Object.entries(engines).map(([engine, version]) => [engine, version || '*']);
    const entries = Object.entries(engines).map(([engine, version]) => [engine, version || '*']);
    return fromEntries(entries);
}
const pSummary = Promise.all([
    pRootRanges,
    pGraphRanges,
    pLatestEngineMajors,
]).then(([{ engines: rootEngines }, { engines: graphEngines }, latestEngineMajors,]) => ({
    output: [
        table([
            [
                'engine',
                majorsHeading,
            ].map((x) => chalk.bold(chalk.gray(x))),
            ...Object.entries(latestEngineMajors).map(([engine, { root, graph },]) => [
                chalk.blue(engine),
                wrapCommaSeparated(intersect([root, graph]), majorsHeading.length),
            ]),
        ]),
        table([
            [
                'package engines:',
                'dependency graph engines:',
            ].map((x) => chalk.bold(chalk.gray(x))),
            [
                `"engines": ${JSON.stringify(normalizeEngines(rootEngines), null, 2)}`,
                `"engines": ${JSON.stringify(normalizeEngines(graphEngines), null, 2)}`,
            ].map((x) => chalk.blue(x)),
        ]),
    ],
}));
Promise.all([
    pGraphRanges,
    pPackage,
    pRootRanges,
]).then(async ([graphRanges, pkg, { engines: rootEngines, valids: rootValids },]) => {
    const { valids: graphValids, ranges: graphDisplayRanges } = graphRanges;
    const pEngines = checkEngines(selectedEngines, rootEngines, rootValids, graphValids, graphDisplayRanges, save);
    const pCurrent = current ? checkCurrent(selectedEngines, rootValids, graphValids) : { output: [] };
    // print out successes first
    const results = await allSettled([pSummary, pEngines, pCurrent]);
    const fulfilleds = results.filter((result) => result.status === 'fulfilled');
    const rejecteds = results.filter((result) => result.status === 'rejected');
    fulfilleds.forEach(({ value: { output } }) => {
        output.forEach((line) => {
            console.log(line);
        });
    });
    // print out failures last
    await rejecteds.reduce(async (prev, error) => {
        await prev;
        if (!error || !error.reason) {
            throw error;
        }
        const { reason } = error;
        // @ts-ignore
        const { code, output, save: doSave } = reason;
        if (!output) {
            throw reason;
        }
        if (save && doSave) {
            doSave(pkg.data);
            try {
                await pkg.save();
            }
            catch {
                process.exitCode |= EXITS.SAVE;
            }
        }
        else {
            process.exitCode |= code;
        }
        output.forEach((line) => {
            console.error(line);
        });
    }, Promise.resolve());
}).catch((e) => {
    console.error((e === null || e === void 0 ? void 0 : e.stack) || e);
    process.exitCode |= EXITS.ERROR;
});
//# sourceMappingURL=ls-engines.js.map