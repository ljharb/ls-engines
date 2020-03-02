'use strict';

const { exec } = require('child_process');

module.exports = async function getNPMVersions() {
	return new Promise((resolve, reject) => {
		exec('npm show --json npm versions', (err, result) => {
			if (err) {
				reject(err);
			} else {
				resolve(JSON.parse(result).map((x) => `v${x}`).sort());
			}
		});
	});
};
