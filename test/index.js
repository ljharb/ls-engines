'use strict';

require('./mock');

const test = require('tape');
const { readdirSync, promises: fs } = require('fs');
const { exec, execSync } = require('child_process');
const path = require('path');
const semver = require('semver');

const EXITS = require('../exit-codes');

const binPath = path.join(__dirname, '..', 'bin', 'ls-engines');
const fixturePath = path.join(__dirname, 'fixtures');
const mockPath = path.join(__dirname, 'mock');
const { GREP, FIXTURE, UPDATE_SNAPSHOTS } = process.env;
const grepRegex = GREP && new RegExp(GREP);
const fixtures = readdirSync(fixturePath)
	.filter((x) => !FIXTURE || FIXTURE === x || (grepRegex && grepRegex.test(x)));
const npmVersion = `v${execSync('npm --version')}`.trim();
const isNPM7 = semver.satisfies(npmVersion, '>= 7');

const replacement = '<node versions for below semver range>';
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
	).replace(
		/(?<before>│ )(?<versions>(?:v[^, │]+(?:, )?)+ *)(?<after>│)$/gm,
		(_, __, ___, ____, _____, ______, { before, versions, after }) => `${before}${replacement.padEnd(versions.length - 1, ' ')} ${after}`,
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

async function getOrUpdate(cwd, cmd, mode, flag, err, res) {
	const errPath = path.join(cwd, filename(mode, flag, 'stderr'));
	const outPath = path.join(cwd, filename(mode, flag, 'stdout'));
	const codePath = path.join(cwd, filename(mode, flag, 'code'));
	if (UPDATE_SNAPSHOTS) {
		const codes = findCodes(err ? err.code : 0);
		const stderr = (err && normalizeNodeVersion(err.message.slice(`Command failed: ${cmd}\n\n`.length))) || null;
		const stdout = normalizeNodeVersion(res) || null;
		await Promise.all([
			fs.writeFile(codePath, `${codes.join('\n')}\n`),
			fs.writeFile(errPath, stderr || ''),
			fs.writeFile(outPath, stdout || ''),
		]);
		return { codes, stderr, stdout };
	}
	const [
		codes,
		stderr,
		stdout,
	] = await Promise.all([
		fs.readFile(codePath, 'utf-8').then((x) => x.trim().split('\n')),
		fs.readFile(errPath, 'utf-8').then((x) => x || null),
		fs.readFile(outPath, 'utf-8').then((x) => x || null),
	]);
	return { codes, stderr, stdout };
}

function testMode(t, fixture, cwd, mode) {
	return ['', '--dev', '--production', '--peer'].reduce(async (prev, flag) => {
		await prev;
		const cmd = `${path.relative(cwd, binPath)} --mode=${mode} ${flag}`.trim();

		t.comment(`## ${fixture}: running \`ls-engines --mode=${`${mode} ${flag}`.trim()}\`...`);
		return new Promise((resolve) => {
			exec(cmd, {
				cwd,
				env: {
					...process.env,
					FORCE_COLOR: 0,
					NODE_OPTIONS: `--require="${mockPath}"`,
				},
			}, (err, res) => {
				resolve();

				t.test(`fixture: ${fixture}, mode: ${mode}${flag ? `, flag: ${flag}` : ''}`, async (st) => {
					st.plan(4);

					const { codes, stderr, stdout } = await getOrUpdate(cwd, cmd, mode, flag, err, res);
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
	t.plan(fixtures.length * 3 * 4);

	return fixtures.reduce(async (prev, fixture) => {
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
