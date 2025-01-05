'use strict';

module.exports = (...functions) => {
	if (functions.length === 0) {
		throw new Error('Expected at least one argument');
	}

	return async input => {
		let currentValue = input;

		for (const fn of functions) {
			currentValue = await fn(currentValue); // eslint-disable-line no-await-in-loop
		}

		return currentValue;
	};
};
