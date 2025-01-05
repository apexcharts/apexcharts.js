declare namespace pPipe {
	type UnaryFunction<ValueType, ReturnType> = (
		value: ValueType
	) => ReturnType | PromiseLike<ReturnType>;

	type Pipeline<ValueType, ReturnType> = (
		value?: ValueType
	) => Promise<ReturnType>;
}

/**
Compose promise-returning & async functions into a reusable pipeline.

@param ...input - Iterated over sequentially when returned `function` is called.
@returns The `input` functions are applied from left to right.

@example
```
import pPipe = require('p-pipe');

const addUnicorn = async string => `${string} Unicorn`;
const addRainbow = async string => `${string} Rainbow`;

const pipeline = pPipe(addUnicorn, addRainbow);

(async () => {
	console.log(await pipeline('❤️'));
	//=> '❤️ Unicorn Rainbow'
})();
```
*/
declare function pPipe<ValueType, ReturnType>(
	f1: pPipe.UnaryFunction<ValueType, ReturnType>
): pPipe.Pipeline<ValueType, ReturnType>;
declare function pPipe<ValueType, ResultValue1, ReturnType>(
	f1: pPipe.UnaryFunction<ValueType, ResultValue1>,
	f2: pPipe.UnaryFunction<ResultValue1, ReturnType>
): pPipe.Pipeline<ValueType, ReturnType>;
declare function pPipe<ValueType, ResultValue1, ResultValue2, ReturnType>(
	f1: pPipe.UnaryFunction<ValueType, ResultValue1>,
	f2: pPipe.UnaryFunction<ResultValue1, ResultValue2>,
	f3: pPipe.UnaryFunction<ResultValue2, ReturnType>
): pPipe.Pipeline<ValueType, ReturnType>;
declare function pPipe<
	ValueType,
	ResultValue1,
	ResultValue2,
	ResultValue3,
	ReturnType
>(
	f1: pPipe.UnaryFunction<ValueType, ResultValue1>,
	f2: pPipe.UnaryFunction<ResultValue1, ResultValue2>,
	f3: pPipe.UnaryFunction<ResultValue2, ResultValue3>,
	f4: pPipe.UnaryFunction<ResultValue3, ReturnType>
): pPipe.Pipeline<ValueType, ReturnType>;
declare function pPipe<
	ValueType,
	ResultValue1,
	ResultValue2,
	ResultValue3,
	ResultValue4,
	ReturnType
>(
	f1: pPipe.UnaryFunction<ValueType, ResultValue1>,
	f2: pPipe.UnaryFunction<ResultValue1, ResultValue2>,
	f3: pPipe.UnaryFunction<ResultValue2, ResultValue3>,
	f4: pPipe.UnaryFunction<ResultValue3, ResultValue4>,
	f5: pPipe.UnaryFunction<ResultValue4, ReturnType>
): pPipe.Pipeline<ValueType, ReturnType>;
declare function pPipe<
	ValueType,
	ResultValue1,
	ResultValue2,
	ResultValue3,
	ResultValue4,
	ResultValue5,
	ReturnType
>(
	f1: pPipe.UnaryFunction<ValueType, ResultValue1>,
	f2: pPipe.UnaryFunction<ResultValue1, ResultValue2>,
	f3: pPipe.UnaryFunction<ResultValue2, ResultValue3>,
	f4: pPipe.UnaryFunction<ResultValue3, ResultValue4>,
	f5: pPipe.UnaryFunction<ResultValue4, ResultValue5>,
	f6: pPipe.UnaryFunction<ResultValue5, ReturnType>
): pPipe.Pipeline<ValueType, ReturnType>;
declare function pPipe<
	ValueType,
	ResultValue1,
	ResultValue2,
	ResultValue3,
	ResultValue4,
	ResultValue5,
	ResultValue6,
	ReturnType
>(
	f1: pPipe.UnaryFunction<ValueType, ResultValue1>,
	f2: pPipe.UnaryFunction<ResultValue1, ResultValue2>,
	f3: pPipe.UnaryFunction<ResultValue2, ResultValue3>,
	f4: pPipe.UnaryFunction<ResultValue3, ResultValue4>,
	f5: pPipe.UnaryFunction<ResultValue4, ResultValue5>,
	f6: pPipe.UnaryFunction<ResultValue5, ResultValue6>,
	f7: pPipe.UnaryFunction<ResultValue6, ReturnType>
): pPipe.Pipeline<ValueType, ReturnType>;
declare function pPipe<
	ValueType,
	ResultValue1,
	ResultValue2,
	ResultValue3,
	ResultValue4,
	ResultValue5,
	ResultValue6,
	ResultValue7,
	ReturnType
>(
	f1: pPipe.UnaryFunction<ValueType, ResultValue1>,
	f2: pPipe.UnaryFunction<ResultValue1, ResultValue2>,
	f3: pPipe.UnaryFunction<ResultValue2, ResultValue3>,
	f4: pPipe.UnaryFunction<ResultValue3, ResultValue4>,
	f5: pPipe.UnaryFunction<ResultValue4, ResultValue5>,
	f6: pPipe.UnaryFunction<ResultValue5, ResultValue6>,
	f7: pPipe.UnaryFunction<ResultValue6, ResultValue7>,
	f8: pPipe.UnaryFunction<ResultValue7, ReturnType>
): pPipe.Pipeline<ValueType, ReturnType>;
declare function pPipe<
	ValueType,
	ResultValue1,
	ResultValue2,
	ResultValue3,
	ResultValue4,
	ResultValue5,
	ResultValue6,
	ResultValue7,
	ResultValue8,
	ReturnType
>(
	f1: pPipe.UnaryFunction<ValueType, ResultValue1>,
	f2: pPipe.UnaryFunction<ResultValue1, ResultValue2>,
	f3: pPipe.UnaryFunction<ResultValue2, ResultValue3>,
	f4: pPipe.UnaryFunction<ResultValue3, ResultValue4>,
	f5: pPipe.UnaryFunction<ResultValue4, ResultValue5>,
	f6: pPipe.UnaryFunction<ResultValue5, ResultValue6>,
	f7: pPipe.UnaryFunction<ResultValue6, ResultValue7>,
	f8: pPipe.UnaryFunction<ResultValue7, ResultValue8>,
	f9: pPipe.UnaryFunction<ResultValue8, ReturnType>
): pPipe.Pipeline<ValueType, ReturnType>;

// Fallbacks if more than 9 functions are passed as input (not type-safe).
declare function pPipe(
	...functions: (pPipe.UnaryFunction<any, unknown>)[]
): pPipe.Pipeline<unknown, unknown>;

export = pPipe;
