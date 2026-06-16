import type getAllVersions from './getAllVersions';

declare namespace validVersionsForEngines {
	export type EnginesRecord = {
		node?: string | null;
		[engine: string]: string | null | undefined;
	};
}

declare function validVersionsForEngines(
	engines: validVersionsForEngines.EnginesRecord,
	allVersions: getAllVersions.VersionsByEngine,
): Promise<getAllVersions.VersionsByEngine>;

export = validVersionsForEngines;
