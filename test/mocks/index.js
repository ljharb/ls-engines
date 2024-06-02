'use strict';

const Module = require('module');

const getJSON = require('../../get-json');

const id = require.resolve('../../get-json');
const mod = new Module(id);
mod.exports = (url, ...args) => {
	if (url === 'http://nodejs.org/dist/index.json') {
		return require('./node-versions.json'); // eslint-disable-line global-require
	}
	return getJSON(url, ...args);
};
require.cache[id] = mod;

process.env.NODE_OPTIONS = `--require="${require.resolve('.')}"`;
