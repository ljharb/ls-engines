import type EXITS from './exit-codes';
import type checkEngines from './checkEngines';

declare namespace processFulfilledResults {
	export type FulfilledCheckResult = {
		status: 'fulfilled';
		value: {
			output: string[];
			save?: checkEngines.SaveFunction;
		};
	};

	export type JSONFileLike = {
		data: Parameters<checkEngines.SaveFunction>[0];
		save(): Promise<void>;
	};
}

declare function processFulfilledResults(
	fulfilled: processFulfilledResults.FulfilledCheckResult[],
	shouldSave: boolean,
	pkg: processFulfilledResults.JSONFileLike,
	exits: typeof EXITS,
	log: typeof console.log,
): Promise<void>;

export = processFulfilledResults;
