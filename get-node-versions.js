'use strict';

const getJSON = require('get-json');

module.exports = async function getNodeVersions() {
	const index = await getJSON('https://nodejs.org/dist/index.json').catch((e) => {
		console.error('Error fetching and parsing JSON from `https://nodejs.org/dist/index.json`');
		throw e;
	});
	return index.map(({ version }) => version);
};
