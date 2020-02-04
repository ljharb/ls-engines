'use strict';

const test = require('tape');
const fs = require('fs');
const { exec, execSync } = require('child_process');
const path = require('path');

const EXITS = require('../exit-codes');

const binPath = path.join(__dirname, '..', 'bin', 'ls-engines');
const fixturePath = path.join(__dirname, 'fixtures');
const fixtures = fs.readdirSync(fixturePath);

function normalizeNodeVersion(output) {
	return output && output.replace(
		`Current node version, v${process.versions.node}`,
		// eslint-disable-next-line no-template-curly-in-string
		'Current node version, v${process.versions.node}',
	);
}

function filename(mode, flag, kind) {
	return [mode, flag.replace(/-/g, ''), kind].filter(Boolean).join('-');
}

function getOrUpdate(cwd, cmd, mode, flag, err, res) {
	const errPath = path.join(cwd, filename(mode, flag, 'stderr'));
	const outPath = path.join(cwd, filename(mode, flag, 'stdout'));
	const codePath = path.join(cwd, filename(mode, flag, 'code'));
	if (process.env.UPDATE_SNAPSHOTS) {
		const code = Object.keys(EXITS).find((name) => EXITS[name] === (err ? err.code : 0));
		const stderr = (err && normalizeNodeVersion(err.message.slice(`Command failed: ${cmd}\n\n`.length))) || null;
		const stdout = normalizeNodeVersion(res) || null;
		fs.writeFileSync(codePath, `${code}\n`);
		fs.writeFileSync(errPath, stderr || '');
		fs.writeFileSync(outPath, stdout || '');
		return { code, stderr, stdout };
	}
	const code = fs.readFileSync(codePath, 'utf-8').trim();
	const stderr = fs.readFileSync(errPath, 'utf-8') || null;
	const stdout = fs.readFileSync(outPath, 'utf-8') || null;
	return { code, stderr, stdout };
}

function testMode(t, fixture, cwd, mode) {
	['', '--dev', '--production'].forEach((flag) => {
		const cmd = `${path.relative(cwd, binPath)} --mode=${mode} ${flag}`.trim();

		exec(cmd, { cwd, env: { ...process.env, FORCE_COLOR: 0 } }, (err, res) => {
			t.test(`fixture: ${fixture}, mode: ${mode}${flag ? `, flag: ${flag}` : ''}`, (st) => {
				st.plan(4);

				const { code, stderr, stdout } = getOrUpdate(cwd, cmd, mode, flag, err, res);
				const succeeds = EXITS[code] === EXITS.SUCCESS;

				if (succeeds) {
					st.equal(err, null, 'command succeeds, as expected');
				} else {
					st.ok(err, 'command fails, as expected');
				}
				st.equal(succeeds ? 0 : err && err.code, EXITS[code], `exit code is \`${code}\` (${EXITS[code]})`);
				st.equal(err && normalizeNodeVersion(err.message), stderr && `Command failed: ${cmd}\n\n${stderr}`, 'stderr is as expected');
				st.equal(normalizeNodeVersion(res), stdout, 'stdout is as expected');
			});
		});
	});
}

test('ls-engines', (t) => {
	t.plan(fixtures.length * 3 * 3);

	fixtures.forEach((fixture) => {
		const cwd = path.join(fixturePath, fixture);
		testMode(t, fixture, cwd, 'ideal');

		testMode(t, fixture, cwd, 'virtual');

		execSync('npm install', { cwd });
		testMode(t, fixture, cwd, 'actual');
	});
});
