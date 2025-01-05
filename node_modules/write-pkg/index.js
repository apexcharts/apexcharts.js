'use strict';
const path = require('path');
const writeJsonFile = require('write-json-file');
const sortKeys = require('sort-keys');

const dependencyKeys = new Set([
	'dependencies',
	'devDependencies',
	'optionalDependencies',
	'peerDependencies'
]);

function normalize(packageJson) {
	const result = {};

	for (const key of Object.keys(packageJson)) {
		if (!dependencyKeys.has(key)) {
			result[key] = packageJson[key];
		} else if (Object.keys(packageJson[key]).length !== 0) {
			result[key] = sortKeys(packageJson[key]);
		}
	}

	return result;
}

module.exports = async (filePath, data, options) => {
	if (typeof filePath !== 'string') {
		options = data;
		data = filePath;
		filePath = '.';
	}

	options = {
		normalize: true,
		...options,
		detectIndent: true
	};

	filePath = path.basename(filePath) === 'package.json' ? filePath : path.join(filePath, 'package.json');

	data = options.normalize ? normalize(data) : data;

	return writeJsonFile(filePath, data, options);
};

module.exports.sync = (filePath, data, options) => {
	if (typeof filePath !== 'string') {
		options = data;
		data = filePath;
		filePath = '.';
	}

	options = {
		normalize: true,
		...options,
		detectIndent: true
	};

	filePath = path.basename(filePath) === 'package.json' ? filePath : path.join(filePath, 'package.json');

	data = options.normalize ? normalize(data) : data;

	writeJsonFile.sync(filePath, data, options);
};
