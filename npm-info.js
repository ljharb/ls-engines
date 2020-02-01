'use strict';

const fs = require('fs').promises;
const path = require('path');

module.exports = async function npmInfo(mode) {
	const pHasNodeModules = mode === 'auto' || mode === 'actual'
		? fs.stat(path.join(process.cwd(), 'node_modules')).catch(() => false)
		: false;

	const packagePath = path.join(process.cwd(), 'package.json');
	const packageLockPath = path.join(process.cwd(), 'package-lock.json');
	const shrinkwrapPath = path.join(process.cwd(), 'npm-shrinkwrap.json');
	const pHasPackageLock = fs.stat(packageLockPath).then(() => true, () => false);

	const pHasLockfile = mode === 'auto' || mode === 'virtual'
		? pHasPackageLock.catch(async (hasPackageLock) => {
			if (!hasPackageLock) {
				return false;
			}
			return fs.stat(shrinkwrapPath).then(() => true, () => false);
		})
		: false;

	const pHasPackage = mode === 'auto' || mode === 'ideal'
		? fs.stat(packagePath).catch(() => false)
		: false;

	/* eslint-disable consistent-return, global-require */
	const pLockfileVersion = Promise.all([
		pHasLockfile,
		pHasPackageLock,
	]).then(async ([
		hasLockfile,
		hasPackageLock,
	]) => {
		if (hasPackageLock) {
			return require(packageLockPath).lockfileVersion;
		}
		if (hasLockfile) {
			return require(shrinkwrapPath).lockfileVersion;
		}
	});
	/* eslint-enable consistent-return, global-require */

	const [
		hasLockfile,
		hasNodeModules,
		hasPackage,
		lockfileVersion,
	] = await Promise.all([
		pHasLockfile,
		pHasNodeModules,
		pHasPackage,
		pLockfileVersion,
	]);

	return {
		hasLockfile,
		hasNodeModules,
		hasPackage,
		lockfileVersion,
	};
};
