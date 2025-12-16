'use strict';

const test = require('tape');
const Semver = require('semver');

const getLatestMajors = require('../getLatestMajors');

test('getLatestMajors', async (t) => {
	t.test('returns latest version of each major', async (st) => {
		const versions = [
			'v14.0.0',
			'v14.5.0',
			'v14.21.0',
			'v16.0.0',
			'v16.10.0',
			'v16.20.0',
			'v18.0.0',
			'v18.19.0',
		];

		const result = getLatestMajors(versions);

		st.ok(Array.isArray(result), 'returns an array');
		st.equal(result.length, 3, 'has 3 majors (14, 16, 18)');
		st.ok(result.includes('v14.21.0'), 'includes latest v14');
		st.ok(result.includes('v16.20.0'), 'includes latest v16');
		st.ok(result.includes('v18.19.0'), 'includes latest v18');
	});

	t.test('respects validRange parameter', async (st) => {
		const versions = [
			'v14.0.0',
			'v14.21.0',
			'v16.0.0',
			'v16.20.0',
			'v18.0.0',
			'v18.19.0',
		];
		const range = new Semver.Range('>= 16');

		const result = getLatestMajors(versions, range);

		st.equal(result.length, 2, 'has 2 majors (16, 18)');
		st.notOk(result.some((v) => Semver.major(v) === 14), 'does not include v14');
		st.ok(result.includes('v16.20.0'), 'includes latest v16');
		st.ok(result.includes('v18.19.0'), 'includes latest v18');
	});

	t.test('handles 0.x versions as separate minors', async (st) => {
		const versions = [
			'v0.10.0',
			'v0.10.48',
			'v0.12.0',
			'v0.12.18',
			'v4.0.0',
			'v4.9.0',
		];

		const result = getLatestMajors(versions);

		// 0.10 and 0.12 should be treated as separate "majors"
		st.ok(result.includes('v0.10.48'), 'includes latest 0.10.x');
		st.ok(result.includes('v0.12.18'), 'includes latest 0.12.x');
		st.ok(result.includes('v4.9.0'), 'includes latest v4');
	});

	t.test('returns empty array for empty versions', async (st) => {
		const result = getLatestMajors([]);

		st.deepEqual(result, [], 'returns empty array');
	});

	t.test('returns empty array when no versions satisfy range', async (st) => {
		const versions = ['v14.0.0', 'v14.21.0'];
		const range = new Semver.Range('>= 20');

		const result = getLatestMajors(versions, range);

		st.deepEqual(result, [], 'returns empty array');
	});

	t.test('results are sorted descending by version', async (st) => {
		const versions = [
			'v14.21.0',
			'v16.20.0',
			'v18.19.0',
			'v20.10.0',
		];

		const result = getLatestMajors(versions);

		for (let i = 1; i < result.length; i++) {
			st.ok(
				Semver.compare(result[i - 1], result[i]) > 0,
				`${result[i - 1]} > ${result[i]}`,
			);
		}
	});

	t.test('defaults to * range when not provided', async (st) => {
		const versions = ['v14.0.0', 'v16.0.0', 'v18.0.0'];

		const result = getLatestMajors(versions);

		st.equal(result.length, 3, 'includes all majors with default * range');
	});

	t.test('handles single version', async (st) => {
		const versions = ['v18.19.0'];

		const result = getLatestMajors(versions);

		st.deepEqual(result, ['v18.19.0'], 'returns the single version');
	});

	t.test('handles prerelease versions', async (st) => {
		const versions = [
			'v18.0.0',
			'v18.19.0',
			'v19.0.0-rc.1',
		];
		const range = new Semver.Range('*');

		const result = getLatestMajors(versions, range);

		// By default semver.maxSatisfying may not include prereleases
		// depending on range. With '*', it should work.
		st.ok(result.includes('v18.19.0'), 'includes latest stable v18');
	});
});
