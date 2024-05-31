'use strict';

const getJSON = require('./get-json');
const semver = require('semver');

module.exports = async function getNodeVersions() {
	const index = await getJSON('https://nodejs.org/dist/index.json').catch((e) => {
		console.error('Error fetching and parsing JSON from `https://nodejs.org/dist/index.json`');
		throw e;
	});
	return index
		.map(({ version }) => version)
		.filter((version) => semver.satisfies(version, '>= 0.4')); // no need to consider older than 0.4
};
