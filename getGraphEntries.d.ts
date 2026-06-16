import type validVersionsForEngines from './validVersionsForEngines';

declare namespace getGraphEntries {
	export type GraphEntry = readonly [string, validVersionsForEngines.EnginesRecord];

	export type GetGraphEntriesOptions = {
		mode: 'auto' | 'actual' | 'virtual' | 'ideal';
		dev: boolean;
		peer: boolean;
		production: boolean;
		selectedEngines: readonly string[];
		logger?: typeof console.log;
		path?: string;
	};
}

declare function getGraphEntries(options: getGraphEntries.GetGraphEntriesOptions): Promise<getGraphEntries.GraphEntry[]>;

export = getGraphEntries;
