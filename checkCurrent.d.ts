import { Engines, EngineVersions } from './bin/ls-engines';

type CheckCurrent = (
	engines: Engines[],
	rootValids: EngineVersions,
	graphValids: EngineVersions,
) => Promise<{
	code?: number;
	output: string[];
}>;

export = CheckCurrent;
