'use strict';

exports.PriorityName = void 0;
(function(PriorityName) {
    PriorityName["LEFT"] = "left";
    PriorityName["RIGHT"] = "right";
})(exports.PriorityName || (exports.PriorityName = {}));

function isObject(item) {
    return !!item && typeof item === 'object' && !Array.isArray(item);
}
function isSafeKey(key) {
    return key !== '__proto__' && key !== 'prototype' && key !== 'constructor';
}
function isEqual(x, y) {
    if (Object.is(x, y)) return true;
    if (x instanceof Date && y instanceof Date) {
        return x.getTime() === y.getTime();
    }
    if (x instanceof RegExp && y instanceof RegExp) {
        return x.toString() === y.toString();
    }
    if (isObject(x) && isObject(y)) {
        const keysX = Reflect.ownKeys(x);
        const keysY = Reflect.ownKeys(y);
        if (keysX.length !== keysY.length) {
            return false;
        }
        for(let i = 0; i < keysX.length; i++){
            const key = keysX[i];
            if (!Reflect.has(y, key) || !isEqual(x[key], y[key])) {
                return false;
            }
        }
        return true;
    }
    if (Array.isArray(x) && Array.isArray(y)) {
        if (x.length !== y.length) {
            return false;
        }
        for(let i = 0; i < x.length; i++){
            if (!isEqual(x[i], y[i])) {
                return false;
            }
        }
        return true;
    }
    return false;
}

function distinctArray(arr) {
    for(let i = 0; i < arr.length; i++){
        for(let j = arr.length - 1; j > i; j--){
            if (isEqual(arr[i], arr[j])) {
                arr.splice(j, 1);
            }
        }
    }
    return arr;
}

/* istanbul ignore next */ const gT = (()=>{
    if (typeof globalThis !== 'undefined') {
        return globalThis;
    }
    // eslint-disable-next-line no-restricted-globals
    if (typeof self !== 'undefined') {
        // eslint-disable-next-line no-restricted-globals
        return self;
    }
    if (typeof window !== 'undefined') {
        return window;
    }
    if (typeof global !== 'undefined') {
        return global;
    }
    throw new Error('unable to locate global object');
})();
function polyfillClone(input) {
    const map = new WeakMap();
    const fn = (value)=>{
        if (Array.isArray(value)) {
            if (map.has(value)) {
                return map.get(value);
            }
            const cloned = [];
            map.set(value, cloned);
            value.map((el)=>cloned.push(fn(el)));
            return cloned;
        }
        if (isObject(value)) {
            if (map.has(value)) {
                return map.get(value);
            }
            const output = {};
            const keys = Object.keys(value);
            map.set(value, output);
            for(let i = 0; i < keys.length; i++){
                output[keys[i]] = fn(value[keys[i]]);
            }
            return output;
        }
        return value;
    };
    return fn(input);
}
/* istanbul ignore next */ function clone(value) {
    if (gT.structuredClone) {
        return gT.structuredClone(value);
    }
    /* istanbul ignore next */ return polyfillClone(value);
}

// eslint-disable-next-line @typescript-eslint/ban-types
function hasOwnProperty(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
}

function buildOptions(options = {}) {
    var _options_array;
    options.array = (_options_array = options.array) != null ? _options_array : true;
    var _options_arrayDistinct;
    options.arrayDistinct = (_options_arrayDistinct = options.arrayDistinct) != null ? _options_arrayDistinct : false;
    var _options_clone;
    options.clone = (_options_clone = options.clone) != null ? _options_clone : false;
    var _options_inPlace;
    options.inPlace = (_options_inPlace = options.inPlace) != null ? _options_inPlace : false;
    options.priority = options.priority || exports.PriorityName.LEFT;
    options.arrayPriority = options.arrayPriority || options.priority;
    return options;
}
function togglePriority(priority) {
    return priority === exports.PriorityName.LEFT ? `${exports.PriorityName.RIGHT}` : `${exports.PriorityName.LEFT}`;
}

function baseMerger(context, ...sources) {
    let target;
    let source;
    let { priority } = context.options;
    if (sources.length >= 2) {
        if (Array.isArray(sources.at(0)) && Array.isArray(sources.at(-1))) {
            priority = context.options.arrayPriority;
        }
    }
    if (priority === exports.PriorityName.RIGHT) {
        target = sources.pop();
        source = sources.pop();
    } else {
        target = sources.shift();
        source = sources.shift();
    }
    if (!source) {
        if (Array.isArray(target) && context.options.arrayDistinct) {
            return distinctArray(target);
        }
        return target;
    }
    if (Array.isArray(target) && Array.isArray(source)) {
        target.push(...source);
        if (context.options.arrayPriority === exports.PriorityName.RIGHT) {
            return baseMerger(context, ...sources, target);
        }
        return baseMerger(context, target, ...sources);
    }
    context.map.set(source, true);
    if (isObject(target) && isObject(source)) {
        const keys = Object.keys(source);
        for(let i = 0; i < keys.length; i++){
            const key = keys[i];
            if (hasOwnProperty(target, key)) {
                if (!isSafeKey(key)) {
                    continue;
                }
                if (context.options.strategy) {
                    const applied = context.options.strategy(target, key, source[key]);
                    if (typeof applied !== 'undefined') {
                        continue;
                    }
                }
                if (isObject(target[key]) && isObject(source[key])) {
                    if (context.map.has(source[key])) {
                        const sourceKeys = Object.keys(source[key]);
                        for(let j = 0; j < sourceKeys.length; j++){
                            if (isSafeKey(sourceKeys[j]) && !hasOwnProperty(target[key], sourceKeys[j])) {
                                target[key][sourceKeys[j]] = source[key][sourceKeys[j]];
                            }
                        }
                        continue;
                    }
                    if (context.options.priority === exports.PriorityName.RIGHT) {
                        target[key] = baseMerger(context, source[key], target[key]);
                    } else {
                        target[key] = baseMerger(context, target[key], source[key]);
                    }
                    continue;
                }
                if (context.options.array && Array.isArray(target[key]) && Array.isArray(source[key])) {
                    const arrayPriority = context.options.priority !== context.options.arrayPriority ? togglePriority(context.options.arrayPriority) : context.options.arrayPriority;
                    switch(arrayPriority){
                        case exports.PriorityName.LEFT:
                            Object.assign(target, {
                                [key]: baseMerger(context, target[key], source[key])
                            });
                            break;
                        case exports.PriorityName.RIGHT:
                            Object.assign(target, {
                                [key]: baseMerger(context, source[key], target[key])
                            });
                            break;
                    }
                }
            } else {
                Object.assign(target, {
                    [key]: source[key]
                });
            }
        }
    }
    context.map = new WeakMap();
    if (context.options.priority === exports.PriorityName.RIGHT) {
        return baseMerger(context, ...sources, target);
    }
    return baseMerger(context, target, ...sources);
}
function createMerger(input) {
    const options = buildOptions(input);
    return (...sources)=>{
        if (!sources.length) {
            throw new SyntaxError('At least one input element is required.');
        }
        const ctx = {
            options,
            map: new WeakMap()
        };
        if (options.clone) {
            return baseMerger(ctx, ...clone(sources));
        }
        if (!options.inPlace) {
            if (Array.isArray(sources.at(0)) && options.arrayPriority === exports.PriorityName.LEFT) {
                sources.unshift([]);
                return baseMerger(ctx, ...sources);
            }
            if (Array.isArray(sources.at(-1)) && options.arrayPriority === exports.PriorityName.RIGHT) {
                sources.push([]);
                return baseMerger(ctx, ...sources);
            }
            if (options.priority === exports.PriorityName.LEFT) {
                sources.unshift({});
            } else {
                sources.push({});
            }
        }
        return baseMerger(ctx, ...sources);
    };
}
const merge = createMerger();

/**
 * Assign source attributes to a target object.
 *
 * @param target
 * @param sources
 */ function assign(target, ...sources) {
    return createMerger({
        inPlace: true,
        priority: 'left',
        array: false
    })(target, ...sources);
}

exports.assign = assign;
exports.buildOptions = buildOptions;
exports.clone = clone;
exports.createMerger = createMerger;
exports.distinctArray = distinctArray;
exports.hasOwnProperty = hasOwnProperty;
exports.isEqual = isEqual;
exports.isObject = isObject;
exports.isSafeKey = isSafeKey;
exports.merge = merge;
exports.polyfillClone = polyfillClone;
exports.togglePriority = togglePriority;
//# sourceMappingURL=index.cjs.map
