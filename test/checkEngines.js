'use strict';

const test = require('tape');

const checkEngines = require('../checkEngines');
const EXITS = require('../exit-codes');

test('checkEngines', async (t) => {
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

	t.test('exact match - engines match dependency graph', async (st) => {
		const selectedEngines = ['node'];
		const rootEngines = { node: '>= 16' };
		const rootValids = { node: ['v16.0.0', 'v16.20.0', 'v18.0.0', 'v18.19.0', 'v20.0.0', 'v20.10.0'] };
		const graphValids = { node: ['v16.0.0', 'v16.20.0', 'v18.0.0', 'v18.19.0', 'v20.0.0', 'v20.10.0'] };
		const graphAllowed = [];
		const graphRanges = { node: { displayRange: '>= 16', validRange: { raw: '>= 16' } } };

		const result = await checkEngines(
			selectedEngines,
			rootEngines,
			rootValids,
			graphValids,
			graphAllowed,
			graphRanges,
			false,
		);

		st.ok(result.output, 'returns output');
		st.ok(result.output.some((line) => line.includes('exactly matches')), 'indicates exact match');
	});

	t.test('engines field missing (all omitted)', async (st) => {
		const selectedEngines = ['node'];
		const rootEngines = { node: null };
		const rootValids = { node: allVersions.node };
		const graphValids = { node: ['v18.0.0', 'v18.19.0', 'v20.0.0', 'v20.10.0'] };
		const graphAllowed = [];
		const graphRanges = { node: { displayRange: '>= 18', validRange: { raw: '>= 18' } } };

		try {
			await checkEngines(
				selectedEngines,
				rootEngines,
				rootValids,
				graphValids,
				graphAllowed,
				graphRanges,
				false,
			);
			st.fail('should have thrown');
		} catch (e) {
			st.equal(e.code, EXITS.IMPLICIT, 'exit code is IMPLICIT');
			st.ok(e.output.some((line) => line.includes('missing')), 'indicates engines field is missing');
			st.ok(typeof e.save === 'function', 'provides save function');
		}
	});

	t.test('engines field is star (all star)', async (st) => {
		const selectedEngines = ['node'];
		const rootEngines = { node: '*' };
		const rootValids = { node: allVersions.node };
		const graphValids = { node: ['v18.0.0', 'v18.19.0', 'v20.0.0', 'v20.10.0'] };
		const graphAllowed = [];
		const graphRanges = { node: { displayRange: '>= 18', validRange: { raw: '>= 18' } } };

		try {
			await checkEngines(
				selectedEngines,
				rootEngines,
				rootValids,
				graphValids,
				graphAllowed,
				graphRanges,
				false,
			);
			st.fail('should have thrown');
		} catch (e) {
			st.equal(e.code, EXITS.IMPLICIT, 'exit code is IMPLICIT');
			st.ok(e.output.some((line) => line.includes('`*`')), 'indicates engines set to star');
		}
	});

	t.test('root is superset of graph (root allows more)', async (st) => {
		const selectedEngines = ['node'];
		const rootEngines = { node: '>= 14' };
		const rootValids = { node: allVersions.node };
		const graphValids = { node: ['v18.0.0', 'v18.19.0', 'v20.0.0', 'v20.10.0'] };
		const graphAllowed = [
			['some-package', { node: '>= 18' }, { node: ['v18.0.0', 'v18.19.0', 'v20.0.0', 'v20.10.0'] }],
		];
		const graphRanges = { node: { displayRange: '>= 18', validRange: { raw: '>= 18' } } };

		try {
			await checkEngines(
				selectedEngines,
				rootEngines,
				rootValids,
				graphValids,
				graphAllowed,
				graphRanges,
				false,
			);
			st.fail('should have thrown');
		} catch (e) {
			st.equal(e.code, EXITS.INEXACT, 'exit code is INEXACT');
			st.ok(e.output.some((line) => line.includes('more')), 'indicates root allows more versions');
		}
	});

	t.test('root is subset of graph (root allows fewer)', async (st) => {
		const selectedEngines = ['node'];
		const rootEngines = { node: '>= 20' };
		const rootValids = { node: ['v20.0.0', 'v20.10.0'] };
		const graphValids = { node: ['v18.0.0', 'v18.19.0', 'v20.0.0', 'v20.10.0'] };
		const graphAllowed = [];
		const graphRanges = { node: { displayRange: '>= 18', validRange: { raw: '>= 18' } } };

		const result = await checkEngines(
			selectedEngines,
			rootEngines,
			rootValids,
			graphValids,
			graphAllowed,
			graphRanges,
			false,
		);

		st.ok(result.output, 'returns output');
		st.ok(result.output.some((line) => line.includes('fewer')), 'indicates root allows fewer versions');
	});

	t.test('--save option provides fix message', async (st) => {
		const selectedEngines = ['node'];
		const rootEngines = { node: null };
		const rootValids = { node: allVersions.node };
		const graphValids = { node: ['v18.0.0', 'v18.19.0', 'v20.0.0', 'v20.10.0'] };
		const graphAllowed = [];
		const graphRanges = { node: { displayRange: '>= 18', validRange: { raw: '>= 18' } } };

		try {
			await checkEngines(
				selectedEngines,
				rootEngines,
				rootValids,
				graphValids,
				graphAllowed,
				graphRanges,
				true, // shouldSave
			);
			st.fail('should have thrown');
		} catch (e) {
			st.ok(e.output.some((line) => line.includes('automatically fix')), 'indicates auto-fix with --save');
		}
	});

	t.test('save function modifies pkg.engines', async (st) => {
		const selectedEngines = ['node'];
		const rootEngines = { node: null };
		const rootValids = { node: allVersions.node };
		const graphValids = { node: ['v18.0.0', 'v18.19.0', 'v20.0.0', 'v20.10.0'] };
		const graphAllowed = [];
		const graphRanges = { node: { displayRange: '>= 18', validRange: { raw: '>= 18' } } };

		try {
			await checkEngines(
				selectedEngines,
				rootEngines,
				rootValids,
				graphValids,
				graphAllowed,
				graphRanges,
				false,
			);
			st.fail('should have thrown');
		} catch (e) {
			const pkg = { engines: {} };
			e.save(pkg);
			st.ok(pkg.engines.node, 'save function sets engines.node');
		}
	});

	t.test('conflicting dependencies are reported', async (st) => {
		const selectedEngines = ['node'];
		const rootEngines = { node: '>= 14' };
		const rootValids = { node: allVersions.node };
		const graphValids = { node: ['v18.0.0', 'v18.19.0', 'v20.0.0', 'v20.10.0'] };
		const graphAllowed = [
			['conflicting-pkg', { node: '>= 18' }, { node: ['v18.0.0', 'v18.19.0', 'v20.0.0', 'v20.10.0'] }],
			['another-pkg', { node: '>= 20' }, { node: ['v20.0.0', 'v20.10.0'] }],
		];
		const graphRanges = { node: { displayRange: '>= 18', validRange: { raw: '>= 18' } } };

		try {
			await checkEngines(
				selectedEngines,
				rootEngines,
				rootValids,
				graphValids,
				graphAllowed,
				graphRanges,
				false,
			);
			st.fail('should have thrown');
		} catch (e) {
			st.equal(e.code, EXITS.INEXACT, 'exit code is INEXACT');
		}
	});
});
