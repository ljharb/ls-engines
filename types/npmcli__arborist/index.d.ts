declare module '@npmcli/arborist' {
	namespace Arborist {
		interface PackageJson {
			name?: string;
			version?: string;
			engines?: { [engine: string]: string | null | undefined };
			_inBundle?: boolean;
			[key: string]: unknown;
		}

		interface Node {
			name: string;
			package: PackageJson;
			dev?: boolean;
			peer?: boolean;
			root: Node | null;
			children: Map<string, Node>;
			edgesOut: Map<string, unknown>;
			edgesIn: Set<unknown>;
			querySelectorAll(selector: string): Promise<Node[]>;
		}
	}

	class Arborist {
		constructor(options?: { packumentCache?: Map<string, unknown>; path?: string; [key: string]: unknown });
		loadActual(): Promise<Arborist.Node>;
		loadVirtual(): Promise<Arborist.Node>;
		buildIdealTree(): Promise<Arborist.Node>;
	}

	export default Arborist;
}
