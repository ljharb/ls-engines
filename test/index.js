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

function getOrUpdate(cwd, cmd, mode, err, res) {
	const errPath = path.join(cwd, `${mode}-stderr`);
	const outPath = path.join(cwd, `${mode}-stdout`);
	const codePath = path.join(cwd, `${mode}-code`);
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

function testMode(t, cwd, mode) {
	const cmd = `${path.relative(cwd, binPath)} --mode=${mode}`;

	exec(cmd, { cwd, env: { ...process.env, FORCE_COLOR: 0 } }, (err, res) => {
		const { code, stderr, stdout } = getOrUpdate(cwd, cmd, mode, err, res);
		const succeeds = EXITS[code] === EXITS.SUCCESS;

		if (succeeds) {
			t.equal(err, null, 'command succeeds, as expected');
		} else {
			t.ok(err, 'command fails, as expected');
		}
		t.equal(succeeds ? 0 : err && err.code, EXITS[code], `exit code is \`${code}\` (${EXITS[code]})`);
		t.equal(err && normalizeNodeVersion(err.message), stderr && `Command failed: ${cmd}\n\n${stderr}`, 'stderr is as expected');
		t.equal(normalizeNodeVersion(res), stdout, 'stdout is as expected');
	});
}

test('ls-engines', (t) => {
	fixtures.filter((x) => true || x === 'graph-engines-only').forEach((fixture) => {
		const cwd = path.join(fixturePath, fixture);

		t.test(`fixture: ${fixture}: ideal`, (ft) => {
			ft.plan(4);
			testMode(ft, cwd, 'ideal');
		});

		t.test(`fixture: ${fixture}: virtual`, (ft) => {
			ft.plan(4);
			testMode(ft, cwd, 'virtual');
		});

		t.test(`fixture: ${fixture}: actual`, (ft) => {
			ft.plan(4);
			execSync('npm install', { cwd });
			testMode(ft, cwd, 'actual');
		});
	});

	t.end();
});
