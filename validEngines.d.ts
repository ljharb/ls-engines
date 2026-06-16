declare const validEngines: readonly ['node'];

declare namespace validEngines {
    export type ValidEngine = typeof validEngines[number];
}

export = validEngines;