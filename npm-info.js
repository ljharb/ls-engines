'use strict';

const fs = require('fs').promises;
const path = require('path');

module.exports = async function npmInfo(mode) {
	const pHasNodeModules = mode === 'auto' || mode === 'actual'
		? fs.stat(path.join(process.cwd(), 'node_modules')).catch(() => false)
		: false;

	const pHasLockfile = mode === 'auto' || mode === 'virtual'
		? fs.stat(path.join(process.cwd(), 'package-lock.json')).catch(() => fs.stat(path.join(process.cwd(), 'npm-shrinkwrap.json'))).catch(() => false)
		: false;

	const pHasPackage = mode === 'auto' || mode === 'ideal'
		? fs.stat(path.join(process.cwd(), 'package.json')).catch(() => false)
		: false;

	const [
		hasLockfile,
		hasNodeModules,
		hasPackage,
	] = await Promise.all([
		pHasLockfile,
		pHasNodeModules,
		pHasPackage,
	]);

	return {
		hasLockfile,
		hasNodeModules,
		hasPackage,
	};
};
