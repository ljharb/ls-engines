declare namespace EXITS {
	export const SUCCESS: 0;
	export const IMPLICIT: 1;
	export const INEXACT: 2;
	export const CURRENT: 4;
	export const SAVE: 8;
	export const DEV_ENGINES: 16;
	export const ERROR: 128;

	export type ExitCode = (
		| typeof SUCCESS
		| typeof IMPLICIT
		| typeof INEXACT
		| typeof CURRENT
		| typeof SAVE
		| typeof DEV_ENGINES
		| typeof ERROR
	);
}

export = EXITS;
