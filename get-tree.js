'use strict';

const Arborist = require('@npmcli/arborist');
const colors = require('colors/safe');
const pacote = require('pacote');

const arb = new Arborist();

const lockfileInfo = require('lockfile-info');

function prune(tree, keepDev, keepProduction, keepPeer) {
	if (!keepDev || !keepProduction) {
		for (const node of tree.children.values()) {
			if ((!keepDev && node.dev) || (!keepProduction && !node.dev) || (!keepPeer && node.peer)) {
				node.root = null;
			}
		}
	}
	return tree;
}

async function getBaseTree(mode, logger) { // eslint-disable-line consistent-return
	const { hasNodeModulesDir, hasLockfile, hasPackageJSON, lockfileVersion } = await lockfileInfo();

	const ideal = mode === 'ideal' || (mode === 'auto' && !hasNodeModulesDir && !hasLockfile);
	const virtual = mode === 'virtual' || (mode === 'auto' && hasLockfile);
	const actual = mode === 'actual' || (mode === 'auto' && hasNodeModulesDir);

	if (ideal) {
		const messages = [].concat(
			`\`${colors.gray('package.json')}\` ${hasPackageJSON ? '' : 'not '}found`,
			mode === 'ideal' ? 'mode is “ideal”' : [],
		);
		logger(colors.green(`${messages.join(', ')}; building ideal tree from \`${colors.gray('package.json')}\`...`));
		return arb.buildIdealTree({ fullMetadata: true, update: { all: true } });
	}

	if (virtual) {
		if (hasLockfile && lockfileVersion < 2) {
			const messages = ['v1 lockfile found'].concat(mode === 'virtual' ? 'mode is “virtual”' : []);
			logger(colors.green(`${messages.join(', ')}; loading ideal tree from lockfile...`));
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
		logger(colors.green(`${messages.join(', ')}; loading virtual tree from lockfile...`));
		return arb.loadVirtual({ fullMetadata: true });
	}

	if (actual) {
		const messages = [].concat(
			hasNodeModulesDir ? `\`${colors.gray('node_modules')}\` found` : [],
			mode === 'actual' ? 'mode is “actual”' : [],
		);
		logger(colors.green(`${messages.join(', ')}; loading tree from disk...`));
		return arb.loadActual();
	}
}

module.exports = async function getTree(mode, { dev, logger = (x) => console.log(x), peer, production } = {}) {
	const tree = await getBaseTree(mode, logger);
	prune(tree, dev, production, peer);
	return tree;
};
