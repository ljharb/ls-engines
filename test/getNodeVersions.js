'use strict';

require('./mock');

const test = require('tape');
const semver = require('semver');

const getNodeVersions = require('../get-node-versions');

test('getNodeVersions', async (t) => {
	const versions = await getNodeVersions();

	t.ok(Array.isArray(versions), 'returns an array');
	t.ok(versions.length > 0, 'array is not empty');
	t.ok(versions.every((v) => typeof v === 'string'), 'all items are strings');
	t.ok(versions.every((v) => v.startsWith('v')), 'all versions start with v');

	t.ok(
		versions.every((v) => semver.satisfies(v, '>= 0.4')),
		'all versions are >= 0.4 (filters out older)',
	);

	t.ok(versions.includes('v18.12.0') || versions.includes('v19.0.0'), 'includes expected versions from mock');

	t.test('rejects when getJSON fails', async (st) => {
		const id = require.resolve('get-json');
		const originalExports = require.cache[id].exports;

		// Temporarily replace getJSON to simulate failure
		const testError = new Error('Network error');
		require.cache[id].exports = () => Promise.reject(testError);

		// Clear require cache for get-node-versions to pick up the new mock
		delete require.cache[require.resolve('../get-node-versions')];
		const getNodeVersionsFresh = require('../get-node-versions'); // eslint-disable-line global-require

		try {
			await getNodeVersionsFresh();
			st.fail('should have thrown');
		} catch (e) {
			st.equal(e, testError, 'rejects with the original error');
		}

		// Restore original mock
		require.cache[id].exports = originalExports;
		delete require.cache[require.resolve('../get-node-versions')];
	});
});
