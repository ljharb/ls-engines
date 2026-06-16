'use strict';

const {
	table: makeTable,
	getBorderCharacters,
} = require('table');

/** @type {import('./table')} */
module.exports = function table(data) {
	return makeTable(data, { border: getBorderCharacters('norc') });
};
