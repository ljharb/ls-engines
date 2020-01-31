'use strict';

const Arborist = require('@npmcli/arborist');
const chalk = require('chalk');

const arb = new Arborist();

const npmInfo = require('./npm-info');

module.exports = async function getTree(mode, logger = (x) => console.log(x)) {
	const { hasNodeModules, hasLockfile, hasPackage } = await npmInfo(mode);

	if (mode === 'actual' || hasNodeModules) {
		const messages = [].concat(
			hasNodeModules ? `\`${chalk.gray('node_modules')}\` found` : [],
			mode === 'actual' ? 'mode is “actual”' : [],
		);
		logger(chalk.green(`${messages.join(', ')}; loading tree from disk...`));
		return arb.loadActual();
	}

	if (mode === 'virtual' || hasLockfile) {
		const messages = [].concat(
			hasLockfile ? 'Lockfile found' : [],
			mode === 'virtual' ? 'mode is “virtual”' : [],
		);
		logger(chalk.green(`${messages.join(', ')}; loading virtual tree from lockfile...`));
		return arb.loadVirtual();
	}

	const messages = [].concat(
		`\`${chalk.gray('package.json')}\` ${hasPackage ? '' : 'not '}found`,
		mode === 'ideal' ? 'mode is “ideal”' : [],
	);
	logger(chalk.green(`${messages.join(', ')}; building ideal tree from \`${chalk.gray('package.json')}\`...`));
	return arb.buildIdealTree();
};
