declare module 'get-json' {
	function getJSON<T = unknown>(url: string): Promise<T>;
	export = getJSON;
}
