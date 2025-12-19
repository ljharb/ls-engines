'use strict';

require('./mock');

const test = require('tape');
const { execSync } = require('child_process');
const { mkdtempSync, cpSync, readFileSync, rmSync } = require('fs');
const { tmpdir } = require('os');
const path = require('path');

const pkg = require('../package.json');

const binEntry = typeof pkg.bin === 'string' ? pkg.bin : pkg.bin[pkg.name];
const binPath = path.join(__dirname, '..', binEntry);
const fixturePath = path.join(__dirname, 'fixtures');

test('--save modifies package.json when save function is provided', (t) => {
	// Use private-with-devengines fixture: devEngines allows fewer versions than graph
	// Running with --save should update devEngines.runtime.version to match graph
	const fixture = 'private-with-devengines';
	const srcDir = path.join(fixturePath, fixture);

	// Create temp directory and copy fixture
	const tempDir = mkdtempSync(path.join(tmpdir(), 'ls-engines-test-'));

	t.teardown(() => {
		rmSync(tempDir, { recursive: true, force: true });
	});

	cpSync(srcDir, tempDir, { recursive: true });

	// Read original package.json
	const originalPkg = JSON.parse(readFileSync(path.join(tempDir, 'package.json'), 'utf8'));
	t.equal(
		originalPkg.devEngines.runtime.version,
		'>= 18',
		'original devEngines.runtime.version is ">= 18"',
	);

	// Run ls-engines --save --no-current (skip current version check)
	try {
		execSync(`node "${binPath}" --mode=ideal --save --no-current`, {
			cwd: tempDir,
			encoding: 'utf8',
			stdio: ['pipe', 'pipe', 'pipe'],
		});
	} catch {
		// Command may exit non-zero, that's ok
	}

	// Read modified package.json
	const modifiedPkg = JSON.parse(readFileSync(path.join(tempDir, 'package.json'), 'utf8'));

	// The save function should have updated devEngines.runtime.version to match graph (">= 10")
	t.equal(
		modifiedPkg.devEngines.runtime.version,
		'>= 10',
		'devEngines.runtime.version should be updated to ">= 10" after --save',
	);

	t.end();
});
