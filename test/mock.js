'use strict';

function mockModule(resolvedSpecifier, replacement) {
	require(resolvedSpecifier); // eslint-disable-line global-require
	const Module = require.cache[resolvedSpecifier];
	Module.exports = replacement;
}

const origGetJSON = require('get-json');
const mockedNodeVersions = require('./mocks/node-versions.json');

mockModule(
	require.resolve('get-json'),
	async function getJSON(url) {
		if (url === 'https://nodejs.org/dist/index.json') {
			return mockedNodeVersions;
		}
		return origGetJSON(url);
	},
);

const childProcess = require('child_process');
const origExecSync = childProcess.execSync;
const mockedNPMVersions = require('./mocks/npm-versions.json');

childProcess.execSync = function execSync(cmd, ...args) {
	if (cmd === 'npm show --json npm versions') {
		return mockedNPMVersions;
	}
	return origExecSync(cmd, ...args);
};
