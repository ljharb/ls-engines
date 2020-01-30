'use strict';

const getJSON = require('get-json');

module.exports = async function getNodeVersions() {
	const index = await getJSON('http://nodejs.org/dist/index.json');
	return index.map(({ version }) => version);
};
