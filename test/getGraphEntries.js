'use strict';

const test = require('tape');
const path = require('path');

const getGraphEntries = require('../getGraphEntries');

const fixturePath = path.join(__dirname, 'fixtures', 'graph-engines-only');

// Silent logger to prevent console output during tests
const silentLogger = () => {};

test('getGraphEntries: default dev/peer values', async (t) => {
	// Mock get-dep-tree to return nodes without dev/peer properties
	const getDepTreeId = require.resolve('get-dep-tree');
	const originalGetDepTree = require.cache[getDepTreeId].exports;
	t.teardown(() => {
		require.cache[getDepTreeId].exports = originalGetDepTree;
		delete require.cache[require.resolve('../getGraphEntries')];
	});

	require.cache[getDepTreeId].exports = () => Promise.resolve({
		querySelectorAll: () => Promise.resolve([
			{
				name: 'test-pkg',
				package: {
					engines: { node: '>= 14' },
				},
				// deliberately omitting dev and peer to test defaults
			},
		]),
	});

	// Clear cache to pick up mock
	delete require.cache[require.resolve('../getGraphEntries')];
	const getGraphEntriesFresh = require('../getGraphEntries'); // eslint-disable-line global-require

	const entries = await getGraphEntriesFresh({
		dev: true,
		logger: silentLogger,
		mode: 'ideal',
		peer: true,
		production: true,
		selectedEngines: ['node'],
	});

	t.ok(Array.isArray(entries), 'returns an array');
	t.equal(entries.length, 1, 'has one entry');
	t.equal(entries[0][0], 'test-pkg', 'entry has correct name');
});

test('getGraphEntries', async (t) => {
	t.test('returns array of entries', async (st) => {
		const entries = await getGraphEntries({
			dev: true,
			logger: silentLogger,
			mode: 'ideal',
			path: fixturePath,
			peer: true,
			production: true,
			selectedEngines: ['node'],
		});

		st.ok(Array.isArray(entries), 'returns an array');
	});

	t.test('each entry is [name, engines] tuple', async (st) => {
		const entries = await getGraphEntries({
			dev: true,
			logger: silentLogger,
			mode: 'ideal',
			path: fixturePath,
			peer: true,
			production: true,
			selectedEngines: ['node'],
		});

		if (entries.length > 0) {
			const [name, engines] = entries[0];
			st.equal(typeof name, 'string', 'first element is package name string');
			st.equal(typeof engines, 'object', 'second element is engines object');
			st.ok(engines !== null, 'engines is not null');
		} else {
			st.pass('no entries (empty dependency graph)');
		}
	});

	t.test('entries are sorted by name then engine', async (st) => {
		const entries = await getGraphEntries({
			dev: true,
			logger: silentLogger,
			mode: 'ideal',
			path: fixturePath,
			peer: true,
			production: true,
			selectedEngines: ['node'],
		});

		if (entries.length > 1) {
			const names = entries.map(([name]) => name);
			// Names should be in alphabetical order (with secondary sort by engine)
			st.ok(
				names.every((name, i) => i === 0 || names[i - 1].localeCompare(name) <= 0),
				'entries are sorted',
			);
		} else {
			st.pass('not enough entries to verify sorting');
		}
	});

	t.test('filters by production flag', async (st) => {
		const prodEntries = await getGraphEntries({
			dev: false,
			logger: silentLogger,
			mode: 'ideal',
			path: fixturePath,
			peer: false,
			production: true,
			selectedEngines: ['node'],
		});

		const allEntries = await getGraphEntries({
			dev: true,
			logger: silentLogger,
			mode: 'ideal',
			path: fixturePath,
			peer: true,
			production: true,
			selectedEngines: ['node'],
		});

		st.ok(prodEntries.length <= allEntries.length, 'production-only has <= entries than all');
	});

	t.test('filters out packages with engines.node = "*"', async (st) => {
		const entries = await getGraphEntries({
			dev: true,
			logger: silentLogger,
			mode: 'ideal',
			path: fixturePath,
			peer: true,
			production: true,
			selectedEngines: ['node'],
		});

		const hasStarEngine = entries.some(([, engines]) => engines.node === '*');
		st.notOk(hasStarEngine, 'no entries with engines.node = "*"');
	});

	t.test('logger receives mode information', async (st) => {
		const logs = [];
		const logger = (...args) => logs.push(args);

		await getGraphEntries({
			dev: true,
			logger,
			mode: 'ideal',
			path: fixturePath,
			peer: true,
			production: true,
			selectedEngines: ['node'],
		});

		st.ok(logs.length > 0, 'logger was called');
		st.ok(
			logs.some((args) => args.some((arg) => typeof arg === 'string' && arg.includes('ideal'))),
			'logger received mode information',
		);
	});

	t.test('works with ideal mode', async (st) => {
		const entries = await getGraphEntries({
			dev: true,
			logger: silentLogger,
			mode: 'ideal',
			path: fixturePath,
			peer: true,
			production: true,
			selectedEngines: ['node'],
		});

		st.ok(Array.isArray(entries), 'mode "ideal" returns array');
	});

	t.test('works with virtual mode when lockfile exists', async (st) => {
		// Virtual mode requires a lockfile
		try {
			const entries = await getGraphEntries({
				dev: true,
				logger: silentLogger,
				mode: 'virtual',
				path: fixturePath,
				peer: true,
				production: true,
				selectedEngines: ['node'],
			});

			st.ok(Array.isArray(entries), 'mode "virtual" returns array');
		} catch (e) {
			// If no lockfile exists, this is expected
			st.ok(e.message.includes('shrinkwrap') || e.message.includes('lockfile'), 'throws expected error without lockfile');
		}
	});
});
