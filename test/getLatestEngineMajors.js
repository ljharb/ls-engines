'use strict';

const test = require('tape');
const Semver = require('semver');

const getLatestEngineMajors = require('../getLatestEngineMajors');

test('getLatestEngineMajors', async (t) => {
	const allVersions = {
		node: [
			'v14.0.0',
			'v14.21.0',
			'v16.0.0',
			'v16.20.0',
			'v18.0.0',
			'v18.19.0',
			'v20.0.0',
			'v20.10.0',
		],
	};

	t.test('returns object with engine keys', async (st) => {
		const selectedEngines = ['node'];
		const rootRanges = { node: { validRange: new Semver.Range('*') } };
		const graphRanges = { node: { validRange: new Semver.Range('>= 16') } };

		const result = await getLatestEngineMajors(selectedEngines, allVersions, rootRanges, graphRanges);

		st.ok(result.node, 'has node key');
		st.ok(result.node.root, 'has root property');
		st.ok(result.node.graph, 'has graph property');
	});

	t.test('root majors include all valid majors', async (st) => {
		const selectedEngines = ['node'];
		const rootRanges = { node: { validRange: new Semver.Range('*') } };
		const graphRanges = { node: { validRange: new Semver.Range('>= 16') } };

		const result = await getLatestEngineMajors(selectedEngines, allVersions, rootRanges, graphRanges);

		st.ok(Array.isArray(result.node.root), 'root is an array');
		st.ok(result.node.root.length > 0, 'root has entries');
		// Should include latest of each major
		const majors = result.node.root.map((v) => Semver.major(v));
		const uniqueMajors = [...new Set(majors)];
		st.equal(majors.length, uniqueMajors.length, 'each major appears once');
	});

	t.test('graph majors respect graph range', async (st) => {
		const selectedEngines = ['node'];
		const rootRanges = { node: { validRange: new Semver.Range('*') } };
		const graphRanges = { node: { validRange: new Semver.Range('>= 18') } };

		const result = await getLatestEngineMajors(selectedEngines, allVersions, rootRanges, graphRanges);

		st.ok(Array.isArray(result.node.graph), 'graph is an array');
		// All graph versions should satisfy >= 18
		st.ok(
			result.node.graph.every((v) => Semver.satisfies(v, '>= 18')),
			'all graph versions satisfy the range',
		);
	});

	t.test('returns empty graph array when no graphRange', async (st) => {
		const selectedEngines = ['node'];
		const rootRanges = { node: { validRange: new Semver.Range('*') } };
		const graphRanges = {}; // no node entry

		const result = await getLatestEngineMajors(selectedEngines, allVersions, rootRanges, graphRanges);

		st.deepEqual(result.node.graph, [], 'graph is empty array when no graphRange');
	});

	t.test('versions are sorted descending', async (st) => {
		const selectedEngines = ['node'];
		const rootRanges = { node: { validRange: new Semver.Range('*') } };
		const graphRanges = { node: { validRange: new Semver.Range('*') } };

		const result = await getLatestEngineMajors(selectedEngines, allVersions, rootRanges, graphRanges);

		const rootVersions = result.node.root;
		for (let i = 1; i < rootVersions.length; i++) {
			st.ok(
				Semver.compare(rootVersions[i - 1], rootVersions[i]) >= 0,
				`${rootVersions[i - 1]} >= ${rootVersions[i]}`,
			);
		}
	});

	t.test('handles multiple engines', async (st) => {
		const multiVersions = {
			node: ['v18.0.0', 'v20.0.0'],
			iojs: ['v1.0.0', 'v2.0.0'],
		};
		const selectedEngines = ['node', 'iojs'];
		const rootRanges = {
			node: { validRange: new Semver.Range('*') },
			iojs: { validRange: new Semver.Range('*') },
		};
		const graphRanges = {
			node: { validRange: new Semver.Range('*') },
			iojs: { validRange: new Semver.Range('*') },
		};

		const result = await getLatestEngineMajors(selectedEngines, multiVersions, rootRanges, graphRanges);

		st.ok(result.node, 'has node');
		st.ok(result.iojs, 'has iojs');
	});
});
