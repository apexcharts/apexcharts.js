declare namespace pWaterfall {
	type Task<ValueType, ReturnType> = (
		previousValue: ValueType
	) => ReturnType | PromiseLike<ReturnType>;

	type InitialTask<ReturnType> = () => ReturnType | PromiseLike<ReturnType>;
}

declare const pWaterfall: {
	/**
	Run promise-returning & async functions in series, each passing its result to the next.

	@param tasks - Functions are expected to return a value. If a `Promise` is returned, it's awaited before continuing with the next task.
	@param initialValue - Value to use as `previousValue` in the first task.
	@returns Resolves when all promises returned from calling the functions in `tasks` are fulfilled, or rejects if any of the promises reject. The fulfilled value is the value returned from the last task.

	@example
	```
	import pWaterfall = require('p-waterfall');

	(async () => {
		const tasks = [
			initialValue => getEmoji(initialValue),
			previousValue => `I ❤️ ${previousValue}`
		];

		console.log(await pWaterfall(tasks, 'unicorn'));
		//=> 'I ❤️ 🦄'
	})();
	```
	*/
	<ReturnType>(
		tasks: readonly [
			pWaterfall.InitialTask<ReturnType>
		]
	): Promise<ReturnType>;
	<ValueType1, ReturnType>(
		tasks: readonly [
			pWaterfall.InitialTask<ValueType1>,
			pWaterfall.Task<ValueType1, ReturnType>
		]
	): Promise<ReturnType>;
	<ValueType1, ValueType2, ReturnType>(
		tasks: readonly [
			pWaterfall.InitialTask<ValueType1>,
			pWaterfall.Task<ValueType1, ValueType2>,
			pWaterfall.Task<ValueType2, ReturnType>
		]
	): Promise<ReturnType>;
	<ValueType1, ValueType2, ValueType3, ReturnType>(
		tasks: readonly [
			pWaterfall.InitialTask<ValueType1>,
			pWaterfall.Task<ValueType1, ValueType2>,
			pWaterfall.Task<ValueType2, ValueType3>,
			pWaterfall.Task<ValueType3, ReturnType>
		]
	): Promise<ReturnType>;
	<ValueType1, ValueType2, ValueType3, ValueType4, ReturnType>(
		tasks: readonly [
			pWaterfall.InitialTask<ValueType1>,
			pWaterfall.Task<ValueType1, ValueType2>,
			pWaterfall.Task<ValueType2, ValueType3>,
			pWaterfall.Task<ValueType3, ValueType4>,
			pWaterfall.Task<ValueType4, ReturnType>
		]
	): Promise<ReturnType>;
	<ValueType1, ValueType2, ValueType3, ValueType4, ValueType5, ReturnType>(
		tasks: readonly [
			pWaterfall.InitialTask<ValueType1>,
			pWaterfall.Task<ValueType1, ValueType2>,
			pWaterfall.Task<ValueType2, ValueType3>,
			pWaterfall.Task<ValueType3, ValueType4>,
			pWaterfall.Task<ValueType4, ValueType5>,
			pWaterfall.Task<ValueType5, ReturnType>
		]
	): Promise<ReturnType>;
	<
		ValueType1,
		ValueType2,
		ValueType3,
		ValueType4,
		ValueType5,
		ValueType6,
		ReturnType
	>(
		tasks: readonly [
			pWaterfall.InitialTask<ValueType1>,
			pWaterfall.Task<ValueType1, ValueType2>,
			pWaterfall.Task<ValueType2, ValueType3>,
			pWaterfall.Task<ValueType3, ValueType4>,
			pWaterfall.Task<ValueType4, ValueType5>,
			pWaterfall.Task<ValueType5, ValueType6>,
			pWaterfall.Task<ValueType6, ReturnType>
		]
	): Promise<ReturnType>;
	<
		ValueType1,
		ValueType2,
		ValueType3,
		ValueType4,
		ValueType5,
		ValueType6,
		ValueType7,
		ReturnType
	>(
		tasks: readonly [
			pWaterfall.InitialTask<ValueType1>,
			pWaterfall.Task<ValueType1, ValueType2>,
			pWaterfall.Task<ValueType2, ValueType3>,
			pWaterfall.Task<ValueType3, ValueType4>,
			pWaterfall.Task<ValueType4, ValueType5>,
			pWaterfall.Task<ValueType5, ValueType6>,
			pWaterfall.Task<ValueType6, ValueType7>,
			pWaterfall.Task<ValueType7, ReturnType>
		]
	): Promise<ReturnType>;

	<ValueType1, ReturnType>(
		tasks: readonly [
			pWaterfall.Task<ValueType1, ReturnType>
		],
		initialValue: ValueType1
	): Promise<ReturnType>;
	<ValueType1, ValueType2, ReturnType>(
		tasks: readonly [
			pWaterfall.Task<ValueType1, ValueType2>,
			pWaterfall.Task<ValueType2, ReturnType>
		],
		initialValue: ValueType1
	): Promise<ReturnType>;
	<ValueType1, ValueType2, ValueType3, ReturnType>(
		tasks: readonly [
			pWaterfall.Task<ValueType1, ValueType2>,
			pWaterfall.Task<ValueType2, ValueType3>,
			pWaterfall.Task<ValueType3, ReturnType>
		],
		initialValue: ValueType1
	): Promise<ReturnType>;
	<ValueType1, ValueType2, ValueType3, ValueType4, ReturnType>(
		tasks: readonly [
			pWaterfall.Task<ValueType1, ValueType2>,
			pWaterfall.Task<ValueType2, ValueType3>,
			pWaterfall.Task<ValueType3, ValueType4>,
			pWaterfall.Task<ValueType4, ReturnType>
		],
		initialValue: ValueType1
	): Promise<ReturnType>;
	<ValueType1, ValueType2, ValueType3, ValueType4, ValueType5, ReturnType>(
		tasks: readonly [
			pWaterfall.Task<ValueType1, ValueType2>,
			pWaterfall.Task<ValueType2, ValueType3>,
			pWaterfall.Task<ValueType3, ValueType4>,
			pWaterfall.Task<ValueType4, ValueType5>,
			pWaterfall.Task<ValueType5, ReturnType>
		],
		initialValue: ValueType1
	): Promise<ReturnType>;
	<
		ValueType1,
		ValueType2,
		ValueType3,
		ValueType4,
		ValueType5,
		ValueType6,
		ReturnType
	>(
		tasks: readonly [
			pWaterfall.Task<ValueType1, ValueType2>,
			pWaterfall.Task<ValueType2, ValueType3>,
			pWaterfall.Task<ValueType3, ValueType4>,
			pWaterfall.Task<ValueType4, ValueType5>,
			pWaterfall.Task<ValueType5, ValueType6>,
			pWaterfall.Task<ValueType6, ReturnType>
		],
		initialValue: ValueType1
	): Promise<ReturnType>;
	<
		ValueType1,
		ValueType2,
		ValueType3,
		ValueType4,
		ValueType5,
		ValueType6,
		ValueType7,
		ReturnType
	>(
		tasks: readonly [
			pWaterfall.Task<ValueType1, ValueType2>,
			pWaterfall.Task<ValueType2, ValueType3>,
			pWaterfall.Task<ValueType3, ValueType4>,
			pWaterfall.Task<ValueType4, ValueType5>,
			pWaterfall.Task<ValueType5, ValueType6>,
			pWaterfall.Task<ValueType6, ValueType7>,
			pWaterfall.Task<ValueType7, ReturnType>
		],
		initialValue: ValueType1
	): Promise<ReturnType>;
	<
		ValueType1,
		ValueType2,
		ValueType3,
		ValueType4,
		ValueType5,
		ValueType6,
		ValueType7,
		ValueType8,
		ReturnType
	>(
		tasks: readonly [
			pWaterfall.Task<ValueType1, ValueType2>,
			pWaterfall.Task<ValueType2, ValueType3>,
			pWaterfall.Task<ValueType3, ValueType4>,
			pWaterfall.Task<ValueType4, ValueType5>,
			pWaterfall.Task<ValueType5, ValueType6>,
			pWaterfall.Task<ValueType6, ValueType7>,
			pWaterfall.Task<ValueType7, ValueType8>,
			pWaterfall.Task<ValueType8, ReturnType>
		],
		initialValue: ValueType1
	): Promise<ReturnType>;
	(
		tasks: Iterable<pWaterfall.Task<unknown, unknown>>,
		initialValue?: unknown
	): Promise<unknown>;

	// TODO: Remove this for the next major release
	default: typeof pWaterfall;
};

export = pWaterfall;
