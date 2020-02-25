#!/usr/bin/env node
import { Range } from 'semver';
declare const selectedEngines: ("node" | "npm")[];
export declare type Engines = typeof selectedEngines[number];
export declare type EngineStrings = {
    [x in Engines]: string;
} | {
    [x: string]: string;
};
export declare type EngineVersions<T extends string[] | string[][] = string[]> = {
    [x in typeof selectedEngines[number]]: T;
} | {
    [x: string]: T;
};
declare type Ranges = {
    displayRange: string;
    validRange: Range;
};
export declare type EngineRanges = {
    [x in typeof selectedEngines[number]]: Ranges;
} | {
    [x: string]: Ranges;
};
export {};
