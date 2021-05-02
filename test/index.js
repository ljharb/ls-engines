'use strict';

const test = require('tape');
const fs = require('fs');
const { exec, execSync } = require('child_process');
const path = require('path');
const semver = require('semver');

const EXITS = require('../exit-codes');

const binPath = path.join(__dirname, '..', 'bin', 'ls-engines');
const fixturePath = path.join(__dirname, 'fixtures');
const grepRegex = process.env.GREP && new RegExp(process.env.GREP);
const fixtures = fs.readdirSync(fixturePath).filter((x) => !process.env.FIXTURE
	|| process.env.FIXTURE === x
	|| (grepRegex && grepRegex.test(x)
	));
const npmVersion = String(execSync('npm --version'));
const isNPM7 = semver.satisfies(npmVersion, '>= 7');

function normalizeNodeVersion(output) {
	return output && output.replace(
		new RegExp(`^(│\\s+node\\s+│\\s+)${process.version}\\s+(│)`, 'm'),
		// eslint-disable-next-line no-template-curly-in-string
		'$1${process.version} $2',
	).replace(
		/Currently available latest releases of each valid node major version: [^\n]+/,
		'Currently available latest releases of each valid node major version: <node versions for above semver range>',
	).replace(
		/\(node:\d{4}\) ExperimentalWarning: The fs.promises API is experimental\n/,
		'',
	).replace(
		/\(node:\d{4}\) ExperimentalWarning: Conditional exports is an experimental feature. This feature could change at any time\n/,
		'',
	).replace(
		isNPM7 ? /^Lockfile/ : /^v1 lockfile/,
		'v1 lockfile',
	);
}

function filename(mode, flag, kind) {
	return [mode, flag.replace(/-/g, ''), kind].filter(Boolean).join('-');
}

function findCodes(code) {
	if (code === 0) {
		return ['SUCCESS'];
	}
	return Object.keys(EXITS).filter((name) => EXITS[name] & code);
}

function getOrUpdate(cwd, cmd, mode, flag, err, res) {
	const errPath = path.join(cwd, filename(mode, flag, 'stderr'));
	const outPath = path.join(cwd, filename(mode, flag, 'stdout'));
	const codePath = path.join(cwd, filename(mode, flag, 'code'));
	if (process.env.UPDATE_SNAPSHOTS) {
		const codes = findCodes(err ? err.code : 0);
		const stderr = (err && normalizeNodeVersion(err.message.slice(`Command failed: ${cmd}\n\n`.length))) || null;
		const stdout = normalizeNodeVersion(res) || null;
		fs.writeFileSync(codePath, `${codes.join('\n')}\n`);
		fs.writeFileSync(errPath, stderr || '');
		fs.writeFileSync(outPath, stdout || '');
		return { codes, stderr, stdout };
	}
	const codes = fs.readFileSync(codePath, 'utf-8').trim().split('\n');
	const stderr = fs.readFileSync(errPath, 'utf-8') || null;
	const stdout = fs.readFileSync(outPath, 'utf-8') || null;
	return { codes, stderr, stdout };
}

function testMode(t, fixture, cwd, mode) {
	return ['', '--dev', '--production'].reduce(async (prev, flag) => {
		await prev;
		const cmd = `${path.relative(cwd, binPath)} --mode=${mode} ${flag}`.trim();

		t.comment(`## ${fixture}: running \`ls-engines --mode=${(mode + ' ' + flag).trim()}\`...`);
		return new Promise((resolve) => {
			exec(cmd, { cwd, env: { ...process.env, FORCE_COLOR: 0 } }, (err, res) => {
				resolve();

				t.test(`fixture: ${fixture}, mode: ${mode}${flag ? `, flag: ${flag}` : ''}`, (st) => {
					st.plan(4);

					const { codes, stderr, stdout } = getOrUpdate(cwd, cmd, mode, flag, err, res);
					const succeeds = codes.length === 1 && codes[0] === 'SUCCESS';

					if (succeeds) {
						st.equal(err, null, 'command succeeds, as expected');
					} else {
						st.ok(err, 'command fails, as expected');
					}
					const actualCode = succeeds ? 0 : err && err.code;
					const derivedCodes = findCodes(actualCode);
					st.deepEqual(derivedCodes, codes, `exit code is \`${actualCode}\` (${derivedCodes})`);
					st.equal(err && normalizeNodeVersion(err.message), stderr && `Command failed: ${cmd}\n\n${stderr}`, 'stderr is as expected');
					st.equal(normalizeNodeVersion(res), stdout, 'stdout is as expected');
				});
			});
		});
	}, Promise.resolve());
}

test('ls-engines', (t) => {
	t.plan(fixtures.length * 3 * 3);

	fixtures.reduce(async (prev, fixture) => {
		await prev;

		const cwd = path.join(fixturePath, fixture);
		t.comment(`## fixture found: ${fixture}`);

		await testMode(t, fixture, cwd, 'ideal');

		await testMode(t, fixture, cwd, 'virtual');

		t.comment(`## ${fixture}: running \`npm install --no-fund --no-audit\`...`);
		execSync('npm install --no-fund --no-audit', { cwd });
		await testMode(t, fixture, cwd, 'actual');
	}, Promise.resolve());
});
