'use strict';

module.exports = async function processFulfilledResults(fulfilled, shouldSave, pkg, EXITS, log) {
	await fulfilled.reduce(async (prev, result) => {
		await prev;
		if (result.status !== 'fulfilled') {
			return;
		}
		const { value } = result;
		const { output } = value;
		const doSave = 'save' in value ? value.save : undefined;

		output.forEach((line) => {
			log(line);
		});

		if (shouldSave && doSave) {
			doSave(pkg.data);
			try {
				await pkg.save();
			} catch {
				process.exitCode |= EXITS.SAVE;
			}
		}
	}, Promise.resolve());
};
