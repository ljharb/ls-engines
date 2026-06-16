import type getAllVersions from './getAllVersions';

declare function getNodeVersions(): Promise<getAllVersions.SemVerString[]>;

export = getNodeVersions;
