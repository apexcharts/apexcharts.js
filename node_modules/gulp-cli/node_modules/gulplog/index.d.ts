/**
 * Highest log level. Typically used for debugging purposes.
 *
 * If the first argument is a string, all arguments are passed to node's util.format() before being emitted.
 *
 * If the first argument is not a string, all arguments will be emitted directly.
 *
 * @param msg Message to log
 * @param args Additional arguments
 */
export function debug(msg: any, ...args: any[]): void;
/**
 * Standard log level. Typically used for user information.
 *
 * If the first argument is a string, all arguments are passed to node's util.format() before being emitted.
 *
 * If the first argument is not a string, all arguments will be emitted directly.
 *
 * @param msg Message to log
 * @param args Additional arguments
 */
export function info(msg: any, ...args: any[]): void;
/**
 * Warning log level. Typically used for warnings.
 *
 * If the first argument is a string, all arguments are passed to node's util.format() before being emitted.
 *
 * If the first argument is not a string, all arguments will be emitted directly.
 *
 * @param msg Message to log
 * @param args Additional arguments
 */
export function warn(msg: any, ...args: any[]): void;
/**
 * Error log level. Typically used when things went horribly wrong.
 *
 * If the first argument is a string, all arguments are passed to node's util.format() before being emitted.
 *
 * If the first argument is not a string, all arguments will be emitted directly.
 *
 * @param msg Message to log
 * @param args Additional arguments
 */
export function error(msg: any, ...args: any[]): void;
