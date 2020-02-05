'use strict';

const fs = require('fs');
const path = require('path');

function stat(file) {
	return new Promise((resolve, reject) => {
		fs.stat(file, (err, result) => {
			if (err) {
				reject(err);
			} else {
				resolve(result);
			}
		});
	});
}

module.exports = async function npmInfo(mode) {
	const pHasNodeModules = mode === 'auto' || mode === 'actual'
		? stat(path.join(process.cwd(), 'node_modules')).catch(() => false)
		: false;

	const packagePath = path.join(process.cwd(), 'package.json');
	const packageLockPath = path.join(process.cwd(), 'package-lock.json');
	const shrinkwrapPath = path.join(process.cwd(), 'npm-shrinkwrap.json');
	const pHasPackageLock = stat(packageLockPath).then(() => true, () => false);

	const pHasLockfile = mode === 'auto' || mode === 'virtual'
		? pHasPackageLock.catch(async (hasPackageLock) => {
			if (!hasPackageLock) {
				return false;
			}
			return stat(shrinkwrapPath).then(() => true, () => false);
		})
		: false;

	const pHasPackage = mode === 'auto' || mode === 'ideal'
		? stat(packagePath).catch(() => false)
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
