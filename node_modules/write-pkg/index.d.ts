import {JsonObject} from 'type-fest';

declare namespace writePackage {
	interface Options {
		/**
		Remove empty `dependencies`, `devDependencies`, `optionalDependencies` and `peerDependencies` objects.

		@default true
		*/
		readonly normalize?: boolean;
	}
}

declare const writePackage: {
	/**
	Write a `package.json` file.

	Writes atomically and creates directories for you as needed. Sorts dependencies when writing. Preserves the indentation if the file already exists.

	@param path - Path to where the `package.json` file should be written or its directory.

	@example
	```
	import * as path from 'path';
	import writePackage = require('write-pkg');

	(async () => {
		await writePackage({foo: true});
		console.log('done');

		await writePackage(__dirname, {foo: true});
		console.log('done');

		await writePackage(path.join('unicorn', 'package.json'), {foo: true});
		console.log('done');
	})();
	```
	*/
	(path: string, data: JsonObject, options?: writePackage.Options): Promise<void>;
	(data: JsonObject, options?: writePackage.Options): Promise<void>;

	/**
	Synchronously write a `package.json` file.

	Writes atomically and creates directories for you as needed. Sorts dependencies when writing. Preserves the indentation if the file already exists.

	@param path - Path to where the `package.json` file should be written or its directory.

	@example
	```
	import * as path from 'path';
	import writePackage = require('write-pkg');

	writePackage.sync({foo: true});
	console.log('done');

	writePackage.sync(__dirname, {foo: true});
	console.log('done');

	writePackage.sync(path.join('unicorn', 'package.json'), {foo: true});
	console.log('done');
	```
	*/
	sync(path: string, data: JsonObject, options?: writePackage.Options): void;
	sync(data: JsonObject, options?: writePackage.Options): void;
};

export = writePackage;
