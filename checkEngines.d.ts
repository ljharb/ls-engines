import { EngineVersions, Engines, EngineStrings, EngineRanges } from './bin/ls-engines';

type CheckEngines = (
	selectedEngines: Engines[],
	rootEngines: EngineStrings,
	rootValids: EngineVersions,
	graphValids: EngineVersions,
	graphRanges: EngineRanges,
	shouldSave: boolean,
) => Promise<{
    output: string[];
    code?: number;
    save?: () => void;
}>

export = CheckEngines;
