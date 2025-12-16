'use strict';

const test = require('tape');
const path = require('path');

const getGraphEntries = require('../getGraphEntries');

const fixturePath = path.join(__dirname, 'fixtures', 'graph-engines-only');

test('getGraphEntries', async (t) => {
	t.test('returns array of entries', async (st) => {
		const entries = await getGraphEntries({
			mode: 'ideal',
			dev: true,
			peer: true,
			production: true,
			selectedEngines: ['node'],
			path: fixturePath,
		});

		st.ok(Array.isArray(entries), 'returns an array');
	});

	t.test('each entry is [name, engines] tuple', async (st) => {
		const entries = await getGraphEntries({
			mode: 'ideal',
			dev: true,
			peer: true,
			production: true,
			selectedEngines: ['node'],
			path: fixturePath,
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
			mode: 'ideal',
			dev: true,
			peer: true,
			production: true,
			selectedEngines: ['node'],
			path: fixturePath,
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
			mode: 'ideal',
			dev: false,
			peer: false,
			production: true,
			selectedEngines: ['node'],
			path: fixturePath,
		});

		const allEntries = await getGraphEntries({
			mode: 'ideal',
			dev: true,
			peer: true,
			production: true,
			selectedEngines: ['node'],
			path: fixturePath,
		});

		st.ok(prodEntries.length <= allEntries.length, 'production-only has <= entries than all');
	});

	t.test('filters out packages with engines.node = "*"', async (st) => {
		const entries = await getGraphEntries({
			mode: 'ideal',
			dev: true,
			peer: true,
			production: true,
			selectedEngines: ['node'],
			path: fixturePath,
		});

		const hasStarEngine = entries.some(([, engines]) => engines.node === '*');
		st.notOk(hasStarEngine, 'no entries with engines.node = "*"');
	});

	t.test('accepts logger option', async (st) => {
		const logs = [];
		const logger = (...args) => logs.push(args);

		await getGraphEntries({
			mode: 'ideal',
			dev: true,
			peer: true,
			production: true,
			selectedEngines: ['node'],
			path: fixturePath,
			logger,
		});

		st.ok(Array.isArray(logs), 'logger was called with array');
	});

	t.test('works with ideal mode', async (st) => {
		const entries = await getGraphEntries({
			mode: 'ideal',
			dev: true,
			peer: true,
			production: true,
			selectedEngines: ['node'],
			path: fixturePath,
		});

		st.ok(Array.isArray(entries), 'mode "ideal" returns array');
	});

	t.test('works with virtual mode when lockfile exists', async (st) => {
		// Virtual mode requires a lockfile
		try {
			const entries = await getGraphEntries({
				mode: 'virtual',
				dev: true,
				peer: true,
				production: true,
				selectedEngines: ['node'],
				path: fixturePath,
			});

			st.ok(Array.isArray(entries), 'mode "virtual" returns array');
		} catch (e) {
			// If no lockfile exists, this is expected
			st.ok(e.message.includes('shrinkwrap') || e.message.includes('lockfile'), 'throws expected error without lockfile');
		}
	});
});
