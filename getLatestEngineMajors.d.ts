import type { Range } from 'semver';
import type { ValidEngine } from './validEngines';
import type getAllVersions from './getAllVersions';

declare namespace getLatestEngineMajors {
	export type RangeInfo = {
		displayRange: string;
		validRange: Range;
	};

	export type RangesByEngine = {
		[engine: string]: RangeInfo;
	};

	export type LatestEngineMajors = {
		[engine: string]: {
			root: getAllVersions.SemVerString[];
			graph: getAllVersions.SemVerString[];
		};
	};
}

declare function getLatestEngineMajors(
	selectedEngines: readonly ValidEngine[],
	allVersions: getAllVersions.VersionsByEngine,
	rootRanges: getLatestEngineMajors.RangesByEngine,
	graphRanges: getLatestEngineMajors.RangesByEngine,
): Promise<getLatestEngineMajors.LatestEngineMajors>;

export = getLatestEngineMajors;
