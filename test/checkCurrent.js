'use strict';

const test = require('tape');

const checkCurrent = require('../checkCurrent');
const EXITS = require('../exit-codes');

test('checkCurrent', async (t) => {
	const currentVersion = process.version;

	t.test('current version is valid for both root and graph', async (st) => {
		const selectedEngines = ['node'];
		const rootValids = { node: [currentVersion] };
		const graphValids = { node: [currentVersion] };

		const result = await checkCurrent(selectedEngines, rootValids, graphValids);

		st.ok(result.output, 'returns output');
		st.ok(Array.isArray(result.output), 'output is an array');
		st.ok(result.output.some((line) => line.includes('yes')), 'indicates valid');
	});

	t.test('current version is invalid for root', async (st) => {
		const selectedEngines = ['node'];
		const rootValids = { node: [] }; // current version not in list
		const graphValids = { node: [currentVersion] };

		try {
			await checkCurrent(selectedEngines, rootValids, graphValids);
			st.fail('should have thrown');
		} catch (e) {
			st.equal(e.code, EXITS.CURRENT, 'exit code is CURRENT');
			st.ok(e.output, 'has output');
			st.ok(e.output.some((line) => line.includes('no')), 'indicates invalid');
		}
	});

	t.test('current version is invalid for graph', async (st) => {
		const selectedEngines = ['node'];
		const rootValids = { node: [currentVersion] };
		const graphValids = { node: [] }; // current version not in list

		try {
			await checkCurrent(selectedEngines, rootValids, graphValids);
			st.fail('should have thrown');
		} catch (e) {
			st.equal(e.code, EXITS.CURRENT, 'exit code is CURRENT');
			st.ok(e.output, 'has output');
		}
	});

	t.test('current version is invalid for both', async (st) => {
		const selectedEngines = ['node'];
		const rootValids = { node: [] };
		const graphValids = { node: [] };

		try {
			await checkCurrent(selectedEngines, rootValids, graphValids);
			st.fail('should have thrown');
		} catch (e) {
			st.equal(e.code, EXITS.CURRENT, 'exit code is CURRENT');
		}
	});

	t.test('output includes table with engine info', async (st) => {
		const selectedEngines = ['node'];
		const rootValids = { node: [currentVersion] };
		const graphValids = { node: [currentVersion] };

		const result = await checkCurrent(selectedEngines, rootValids, graphValids);

		st.ok(result.output.some((line) => line.includes('node')), 'output includes engine name');
		st.ok(result.output.some((line) => line.includes(currentVersion)), 'output includes current version');
	});
});
