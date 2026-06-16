declare module 'pacote' {
	export interface Manifest {
		name?: string;
		version?: string;
		engines?: { [engine: string]: string | null | undefined };
		[key: string]: unknown;
	}

	export interface ManifestResult {
		_resolved?: string;
		_integrity?: string;
		[key: string]: unknown;
	}

	export function manifest(spec: string, opts?: unknown): Promise<Manifest & ManifestResult>;
}
