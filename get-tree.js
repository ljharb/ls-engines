'use strict';

const Arborist = require('@npmcli/arborist');
const chalk = require('chalk');
const pacote = require('pacote');

const arb = new Arborist();

const npmInfo = require('./npm-info');

function prune(tree, keepDev, keepProduction) {
	if (!keepDev || !keepProduction) {
		for (const node of tree.children.values()) {
			if ((!keepDev && node.dev) || (!keepProduction && !node.dev)) {
				node.parent = null;
			}
		}
	}
	return tree;
}

async function getBaseTree(mode, logger) {
	const { hasNodeModules, hasLockfile, hasPackage, lockfileVersion } = await npmInfo(mode);

	if (mode === 'actual' || hasNodeModules) {
		const messages = [].concat(
			hasNodeModules ? `\`${chalk.gray('node_modules')}\` found` : [],
			mode === 'actual' ? 'mode is “actual”' : [],
		);
		logger(chalk.green(`${messages.join(', ')}; loading tree from disk...`));
		return arb.loadActual();
	}

	if (mode === 'virtual' || hasLockfile) {
		if (hasLockfile && lockfileVersion < 2) {
			const messages = [].concat(
				hasLockfile ? 'v1 lockfile found' : [],
				mode === 'virtual' ? 'mode is “virtual”' : [],
			);
			logger(chalk.green(`${messages.join(', ')}; loading ideal tree from lockfile...`));
			const tree = await arb.buildIdealTree({ fullMetadata: true });
			await Promise.all(Array.from(
				tree.children.values(),
				async (node) => {
					// eslint-disable-next-line no-param-reassign
					node.package = await pacote.manifest(`${node.name}@${node.package.version}`, { fullMetadata: true });
				},
			));
			return tree;
		}
		const messages = [].concat(
			hasLockfile ? 'Lockfile found' : [],
			mode === 'virtual' ? 'mode is “virtual”' : [],
		);
		logger(chalk.green(`${messages.join(', ')}; loading virtual tree from lockfile...`));
		return arb.loadVirtual({ fullMetadata: true });
	}

	const messages = [].concat(
		`\`${chalk.gray('package.json')}\` ${hasPackage ? '' : 'not '}found`,
		mode === 'ideal' ? 'mode is “ideal”' : [],
	);
	logger(chalk.green(`${messages.join(', ')}; building ideal tree from \`${chalk.gray('package.json')}\`...`));
	return arb.buildIdealTree({ fullMetadata: true, update: { all: true } });
}

module.exports = async function getTree(mode, { dev, logger = (x) => console.log(x), production } = {}) {
	const tree = await getBaseTree(mode, logger);
	prune(tree, dev, production);
	return tree;
};
