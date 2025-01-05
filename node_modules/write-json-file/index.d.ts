declare namespace writeJsonFile {
	type Replacer = (this: unknown, key: string, value: any) => unknown;
	type SortKeys = (a: string, b: string) => number;
	type JSONStringifyable = string | number | boolean | null | object;

	interface Options {
		/**
		Indentation as a string or number of spaces. Pass in null for no formatting.

		@default '\t'
		*/
		readonly indent?: string | number | null;

		/**
		Detect indentation automatically if the file exists.

		@default false
		*/
		readonly detectIndent?: boolean;

		/**
		Sort the keys recursively. Optionally pass in a compare function.

		@default false
		*/
		readonly sortKeys?: boolean | SortKeys;

		/**
		Passed into `JSON.stringify`.
		*/
		readonly replacer?: Replacer | Array<number | string>;

		/**
		Mode used when writing the file.

		@default 0o666
		*/
		readonly mode?: number;
	}
}

declare const writeJsonFile: {
	/**
	Stringify and write JSON to a file atomically.

	Creates directories for you as needed.

	@example
	```
	import writeJsonFile = require('write-json-file');

	(async () => {
		await writeJsonFile('foo.json', {foo: true});
	})();
	```
	*/
	(
		filepath: string,
		data: writeJsonFile.JSONStringifyable,
		options?: writeJsonFile.Options
	): Promise<void>;

	/**
	Stringify and write JSON to a file atomically.

	Creates directories for you as needed.

	@example
	```
	import writeJsonFile = require('write-json-file');

	writeJsonFile.sync('foo.json', {foo: true});
	```
	*/
	sync(
		filepath: string,
		data: writeJsonFile.JSONStringifyable,
		options?: writeJsonFile.Options
	): void;

	// TODO: Remove this for the next major release
	default: typeof writeJsonFile;
};

export = writeJsonFile;
