import type { Range } from 'semver';
import type getAllVersions from './getAllVersions';

declare function getLatestMajors(versions: getAllVersions.SemVerString[], validRange?: Range): getAllVersions.SemVerString[];

export = getLatestMajors;
