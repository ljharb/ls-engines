'use strict';

const test = require('tape');
const v = require('es-value-fixtures');
const inspect = require('object-inspect');

const validVersionsForEngines = require('../validVersionsForEngines');

test('validVersionsForEngines', async (t) => {
	await Promise.all(v.primitives.map(async (nonObject) => {
		try {
			await validVersionsForEngines(nonObject);
		} catch (e) {
			t.throws(
				() => { throw e; },
				TypeError,
				`engines: ${inspect(nonObject)} is not an object`,
			);
		}

		try {
			await validVersionsForEngines({}, nonObject);
		} catch (e) {
			t.throws(
				() => { throw e; },
				TypeError,
				`allVersions: ${inspect(nonObject)} is not an object`,
			);
		}
	}));

	const engines = {
		foo: '>= 1',
		bar: '< 5',
	};

	const allVersions = {
		foo: [
			'v0.1.2',
			'v2.3.4',
			'v4.5.6',
			'v6.7.8',
		],
		bar: [
			'v0.1.2',
			'v1.2.3',
			'v3.4.5',
			'v5.6.7',
		],
		baz: [
			'v3.4.5',
			'v5.6.7',
			'v7.8.9',
		],
	};

	const validVersions = await validVersionsForEngines(engines, allVersions);
	t.deepEqual(
		validVersions,
		{
			foo: ['v2.3.4', 'v4.5.6', 'v6.7.8'],
			bar: ['v0.1.2', 'v1.2.3', 'v3.4.5'],
			baz: ['v3.4.5', 'v5.6.7', 'v7.8.9'],
		},
		'valid versions are as expected',
	);
});
