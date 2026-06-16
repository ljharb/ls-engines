import type getAllVersions from './getAllVersions';
import type validVersionsForEngines from './validVersionsForEngines';
import type getGraphEntries from './getGraphEntries';

declare namespace getGraphValids {
	export type GraphAllowedEntry = readonly [string, validVersionsForEngines.EnginesRecord, getAllVersions.VersionsByEngine];

	export type GetGraphValidsResult = {
		allowed: GraphAllowedEntry[];
		valids: Partial<getAllVersions.VersionsByEngine>;
	};
}

declare function getGraphValids(
	graphEntries: getGraphEntries.GraphEntry[],
	allVersions: getAllVersions.VersionsByEngine,
): Promise<getGraphValids.GetGraphValidsResult>;

export = getGraphValids;
