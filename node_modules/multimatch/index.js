'use strict';
const minimatch = require('minimatch');
const arrayUnion = require('array-union');
const arrayDiffer = require('array-differ');
const arrify = require('arrify');

module.exports = (list, patterns, options = {}) => {
	list = arrify(list);
	patterns = arrify(patterns);

	if (list.length === 0 || patterns.length === 0) {
		return [];
	}

	let result = [];
	for (const item of list) {
		for (let pattern of patterns) {
			let process = arrayUnion;

			if (pattern[0] === '!') {
				pattern = pattern.slice(1);
				process = arrayDiffer;
			}

			result = process(result, minimatch.match([item], pattern, options));
		}
	}

	return result;
};
