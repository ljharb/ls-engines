// Override `Object.entries`/`Object.fromEntries` so the key and value types of
// the operand are preserved, rather than the keys being widened to `string` and
// the values to `any`. See https://github.com/microsoft/TypeScript/issues/35745

interface ObjectConstructor {
	entries<T extends object>(o: T): {
		[K in keyof T]-?: [K extends number ? `${K}` : K, Required<T>[K]];
	}[keyof T][];
	fromEntries<K extends PropertyKey, V>(entries: Iterable<readonly [K, V]>): Record<K, V>;
}
