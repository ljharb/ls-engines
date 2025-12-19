'use strict';

const test = require('tape');

const processFulfilledResults = require('../processFulfilledResults');
const EXITS = require('../exit-codes');

test('processFulfilledResults', (t) => {
	t.test('calls save function from fulfilled result when shouldSave is true', async (st) => {
		let saveCalled = false;
		const mockSave = () => { saveCalled = true; };

		const fulfilled = [
			{
				status: 'fulfilled',
				value: {
					output: ['line 1'],
					save: mockSave,
				},
			},
		];

		const mockPkg = {
			data: {},
			save: st.captureFn(() => Promise.resolve()),
		};

		await processFulfilledResults(fulfilled, true, mockPkg, EXITS, () => {});

		st.ok(saveCalled, 'save function should be called when shouldSave is true');
	});

	t.test('does not call save function when shouldSave is false', async (st) => {
		let saveCalled = false;
		const mockSave = () => { saveCalled = true; };

		const fulfilled = [
			{
				status: 'fulfilled',
				value: {
					output: ['line 1'],
					save: mockSave,
				},
			},
		];

		const mockPkg = {
			data: {},
			save: st.captureFn(() => Promise.resolve()),
		};

		await processFulfilledResults(fulfilled, false, mockPkg, EXITS, () => {});

		st.notOk(saveCalled, 'save function should not be called when shouldSave is false');
	});

	t.test('logs output from fulfilled results', async (st) => {
		const logged = [];
		const fulfilled = [
			{
				status: 'fulfilled',
				value: {
					output: ['line 1', 'line 2'],
				},
			},
		];

		const mockPkg = {
			data: {},
			save: st.captureFn(() => Promise.resolve()),
		};

		await processFulfilledResults(fulfilled, false, mockPkg, EXITS, (line) => logged.push(line));

		st.deepEqual(logged, ['line 1', 'line 2'], 'logs all output lines');
	});

	t.test('skips non-fulfilled results', async (st) => {
		const logged = [];
		const results = [
			{
				status: 'rejected',
				reason: new Error('test'),
			},
			{
				status: 'fulfilled',
				value: {
					output: ['from fulfilled'],
				},
			},
		];

		const mockPkg = {
			data: {},
			save: st.captureFn(() => Promise.resolve()),
		};

		await processFulfilledResults(results, false, mockPkg, EXITS, (line) => logged.push(line));

		st.deepEqual(logged, ['from fulfilled'], 'only logs from fulfilled results');
	});

	t.test('handles results without save function', async (st) => {
		const fulfilled = [
			{
				status: 'fulfilled',
				value: {
					output: ['line 1'],
				},
			},
		];

		const mockPkg = {
			data: {},
			save: st.captureFn(() => Promise.resolve()),
		};

		await processFulfilledResults(fulfilled, true, mockPkg, EXITS, () => {});

		st.equal(mockPkg.save.calls.length, 0, 'pkg.save should not be called when no save function');
	});
});
