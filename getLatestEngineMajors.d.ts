import { Engines, EngineVersions, EngineRanges } from './bin/ls-engines';

export type EngineMajors = {
	[x in Engines]: {
		root: string[];
		graph: string[];
	};
};

type GetLatestEngineMajors = (
    selectedEngines: Engines[],
	allVersions: EngineVersions,
	rootRanges: EngineRanges,
	graphRanges: EngineRanges,
) => Promise<EngineMajors>

export default GetLatestEngineMajors;
