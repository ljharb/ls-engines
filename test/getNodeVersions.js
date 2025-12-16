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
});
