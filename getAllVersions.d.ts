import type { ValidEngine } from './validEngines';

declare namespace getAllVersions {
	/** A string representing a semantic version (e.g., "v1.2.3" or "1.2.3") */
	export type SemVerString =
		| `${number}.${number}.${number}`
		| `${number}.${number}.${number}-${string}`
		| `${number}.${number}.${number}+${string}`
		| `${number}.${number}.${number}-${string}+${string}`
		| `v${number}.${number}.${number}`
		| `v${number}.${number}.${number}-${string}`
		| `v${number}.${number}.${number}+${string}`
		| `v${number}.${number}.${number}-${string}+${string}`
		| (string & {});

	export type VersionsByEngine = { [engine in ValidEngine]: SemVerString[] };
}

declare function getAllVersions(selectedEngines: readonly ValidEngine[]): Promise<getAllVersions.VersionsByEngine>;

export = getAllVersions;
