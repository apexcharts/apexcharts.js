'use strict';
const pReduce = require('p-reduce');

const pWaterfall = (iterable, initialValue) =>
	pReduce(iterable, (previousValue, fn) => fn(previousValue), initialValue);

module.exports = pWaterfall;
// TODO: Remove this for the next major release
module.exports.default = pWaterfall;
