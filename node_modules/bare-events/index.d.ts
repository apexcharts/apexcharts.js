declare class EventEmitter {
  addListener(name: string | symbol, fn: Function): this
  addOnceListener(name: string | symbol, fn: Function): this

  prependListener(name: string | symbol, fn: Function): this
  prependOnceListener(name: string | symbol, fn: Function): this

  removeListener(name: string | symbol, fn: Function): this
  removeAllListeners(name?: string | symbol): this

  on(name: string | symbol, fn: Function): this
  once(name: string | symbol, fn: Function): this
  off(name: string | symbol, fn: Function): this

  emit(name: string | symbol, ...args: unknown[]): boolean

  listeners(name: string | symbol): Function[]
  listenerCount(name: string | symbol): number

  getMaxListeners(): number
  setMaxListeners(n: number): void
}

declare namespace EventEmitter {
  export function on(
    emitter: EventEmitter,
    name: string | symbol,
    opts?: { signal?: AbortSignal }
  ): AsyncIterableIterator<unknown[]>

  export function once(
    emitter: EventEmitter,
    name: string | symbol,
    opts?: { signal?: AbortSignal }
  ): Promise<unknown>

  export function forward(
    from: EventEmitter,
    to: EventEmitter,
    names: string | string[] | symbol[],
    opts?: { emit?: (name: string, ...args: unknown[]) => void }
  ): void

  export function listenerCount(
    emitter: EventEmitter,
    name: string | symbol
  ): number

  export let defaultMaxListeners: number

  class EventEmitterError extends Error {
    static OPERATION_ABORTED(cause: Error, msg?: string): EventEmitterError
    static UNHANDLED_ERROR(cause: Error, msg?: string): EventEmitterError
  }

  export { EventEmitter, EventEmitterError as errors }
}

export = EventEmitter
