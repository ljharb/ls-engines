import type { ValidEngine } from './validEngines';
import type getAllVersions from './getAllVersions';
import type EXITS from './exit-codes';

declare namespace checkCurrent {
	export type CheckCurrentResult = {
		output: string[];
	};

	export type CheckCurrentError = {
		code: typeof EXITS.CURRENT;
		output: string[];
	};
}

declare function checkCurrent(
	selectedEngines: readonly ValidEngine[],
	rootValids: getAllVersions.VersionsByEngine,
	graphValids: getAllVersions.VersionsByEngine,
): Promise<checkCurrent.CheckCurrentResult>;

export = checkCurrent;
