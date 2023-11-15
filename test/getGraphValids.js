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

	t.deepEqual(
		await getGraphValids([], allVersions),
		{ allowed: [], valids: {} },
		'handles an empty graphEntries array',
	);

	const graphEntries = [
		['one', {
			foo: '^1.0.0',
			bar: '>= 2',
		}],
		['two', {
			foo: '^1.3.4',
			baz: '^0',
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
						foo: '^1.0.0',
						bar: '>= 2',
					},
					{
						foo: [],
						bar: ['v3.4.5', 'v5.6.7'],
						baz: allVersions.baz,
					},
				],
				[
					'two',
					{
						foo: '^1.3.4', baz: '^0',
					},
					{
						foo: [],
						bar: allVersions.bar,
						baz: [],
					},
				],
				[
					'three',
					{
						foo: '^2.0.0',
					},
					{
						foo: ['v2.3.4'],
						bar: allVersions.bar,
						baz: allVersions.baz,
					},
				],
				[
					'four',
					{
						foo: '^2.4.5',
					},
					{
						foo: [],
						bar: allVersions.bar,
						baz: allVersions.baz,
					},
				],
			],
			valids: {
				foo: [],
				bar: ['v5.6.7', 'v3.4.5'],
				baz: [],
			},
		},
		'handles a populated graphEntries array',
	);
});
