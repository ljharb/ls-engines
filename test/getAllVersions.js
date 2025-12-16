'use strict';

require('./mock');

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

	t.test('getting node versions', async (st) => {
		const result = await getAllVersions(['node']);

		st.ok(result.node, 'result has node key');
		st.ok(Array.isArray(result.node), 'node value is an array');
		st.ok(result.node.length > 0, 'node versions array is not empty');
		st.ok(result.node.every((x) => typeof x === 'string'), 'all node versions are strings');
		st.ok(result.node.every((x) => x.startsWith('v')), 'all node versions start with v');
	});

	t.test('returns object with only selected engines', async (st) => {
		const result = await getAllVersions(['node']);

		const keys = Object.keys(result);
		st.deepEqual(keys, ['node'], 'only node key present');
	});
});
