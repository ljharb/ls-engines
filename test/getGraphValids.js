'use strict';

const test = require('tape');
const v = require('es-value-fixtures');
const inspect = require('object-inspect');

const getGraphValids = require('../getGraphValids');

test('getGraphValids', async (t) => {
	await Promise.all([].concat(
		v.nonArrays.map(async (nonArray) => {
			try {
				await getGraphValids(nonArray);
			} catch (e) {
				t.throws(
					() => { throw e; },
					TypeError,
					`graphEntries: ${inspect(nonArray)} is not an array`,
				);
			}
		}),
		v.primitives.map(async (nonObject) => {
			try {
				await getGraphValids([], nonObject);
			} catch (e) {
				t.throws(
					() => { throw e; },
					TypeError,
					`engines: ${inspect(nonObject)} is not an object`,
				);
			}
		}),
	));

	const allVersions = {
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
		foo: [
			'v0.1.2',
			'v2.3.4',
			'v4.5.6',
			'v6.7.8',
		],
	};

	t.deepEqual(
		await getGraphValids([], allVersions),
		{ allowed: [], valids: {} },
		'handles an empty graphEntries array',
	);

	const graphEntries = [
		['one', {
			bar: '>= 2',
			foo: '^1.0.0',
		}],
		['two', {
			baz: '^0',
			foo: '^1.3.4',
		}],
		['three', {
			foo: '^2.0.0',
		}],
		['four', {
			foo: '^2.4.5',
		}],
	];

	t.deepEqual(
		await getGraphValids(graphEntries, allVersions),
		{
			allowed: [
				[
					'one',
					{
						bar: '>= 2',
						foo: '^1.0.0',
					},
					{
						bar: ['v3.4.5', 'v5.6.7'],
						baz: allVersions.baz,
						foo: [],
					},
				],
				[
					'two',
					{
						baz: '^0', foo: '^1.3.4',
					},
					{
						bar: allVersions.bar,
						baz: [],
						foo: [],
					},
				],
				[
					'three',
					{
						foo: '^2.0.0',
					},
					{
						bar: allVersions.bar,
						baz: allVersions.baz,
						foo: ['v2.3.4'],
					},
				],
				[
					'four',
					{
						foo: '^2.4.5',
					},
					{
						bar: allVersions.bar,
						baz: allVersions.baz,
						foo: [],
					},
				],
			],
			valids: {
				bar: ['v5.6.7', 'v3.4.5'],
				baz: [],
				foo: [],
			},
		},
		'handles a populated graphEntries array',
	);
});
