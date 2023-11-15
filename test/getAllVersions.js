'use strict';

const test = require('tape');
const v = require('es-value-fixtures');
const inspect = require('object-inspect');

const getAllVersions = require('../getAllVersions');

test('getAllVersions', async (t) => {
	await Promise.all(v.nonArrays.map(async (nonArray) => {
		try {
			await getAllVersions(nonArray);
		} catch (e) {
			t.throws(
				() => { throw e; },
				TypeError,
				`selectedEngines: ${inspect(nonArray)} is not an array`,
			);
		}
	}));

	t.deepEqual(await getAllVersions([]), {}, 'no selected engines -> no versions');

	try {
		await getAllVersions(['unknown engine']);
	} catch (e) {
		t.throws(
			() => { throw e; },
			TypeError,
			'unknown engine throws',
		);
	}

	t.test('test getting node versions', { todo: 'figure out how to mock this' });
});
