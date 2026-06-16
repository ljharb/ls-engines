import type { ValidEngine } from './validEngines';
import type getAllVersions from './getAllVersions';
import type validVersionsForEngines from './validVersionsForEngines';
import type getLatestEngineMajors from './getLatestEngineMajors';
import type getGraphValids from './getGraphValids';
import type EXITS from './exit-codes';

declare namespace checkEngines {
	export type SaveFunction = (pkg: {
		engines?: validVersionsForEngines.EnginesRecord;
		devEngines?: {
			runtime?: { name: string; version?: string | null } | Array<{ name: string; version?: string | null }>;
		};
	}) => void;

	export type CheckEnginesResult = {
		output: (string | string[])[];
		code?: typeof EXITS.SUCCESS | typeof EXITS.INEXACT;
		save?: SaveFunction;
	};

	export type CheckEnginesError = {
		code: typeof EXITS.IMPLICIT | typeof EXITS.INEXACT;
		output: (string | string[])[];
		save: SaveFunction;
	};
}

declare function checkEngines(
	selectedEngines: readonly ValidEngine[],
	rootEngines: validVersionsForEngines.EnginesRecord,
	rootValids: getAllVersions.VersionsByEngine,
	graphValids: getAllVersions.VersionsByEngine,
	graphAllowed: getGraphValids.GraphAllowedEntry[],
	graphRanges: Partial<getLatestEngineMajors.RangesByEngine>,
	shouldSave: boolean,
	useDevEngines: boolean,
): Promise<checkEngines.CheckEnginesResult>;

export = checkEngines;
