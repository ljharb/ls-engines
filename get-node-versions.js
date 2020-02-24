'use strict';

const getJSON = require('get-json');
const Semver = require('semver');

module.exports = async function getNodeVersions() {
	const index = await getJSON('http://nodejs.org/dist/index.json');
	return index
		.map(({ version }) => version)
		.filter((version) => Semver.satisfies(version, '>= 0.4')); // no need to consider older than 0.4
};
