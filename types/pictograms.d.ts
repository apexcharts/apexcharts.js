/**
 * Types for `apexcharts/pictograms`.
 *
 * Deliberately standalone: the structural types below mirror the unit-mark
 * contract in `apexcharts.d.ts` rather than importing it, so the glyph
 * collection can be consumed (or one day extracted) without pulling the chart's
 * whole declaration file into a project's type graph.
 */

export type ApexPictogramCategory =
  | 'people'
  | 'nature'
  | 'objects'
  | 'transport'
  | 'symbols'

/** One glyph. Data, not a function: a layout computes, a mark is geometry. */
export interface ApexPictogram {
  readonly name: string
  /** Fill-only outline, in `viewBox` units. */
  readonly path: string
  readonly viewBox: readonly [number, number, number, number]
  readonly fillRule?: 'nonzero' | 'evenodd'
  readonly category?: ApexPictogramCategory
  readonly source?: 'original' | 'generated'
  /** A variant with some metadata replaced. */
  with(overrides: Partial<Omit<ApexPictogram, 'with'>>): ApexPictogram
}

export declare const person: ApexPictogram
export declare const house: ApexPictogram
export declare const heart: ApexPictogram
export declare const tree: ApexPictogram
export declare const droplet: ApexPictogram
export declare const star: ApexPictogram
export declare const car: ApexPictogram
export declare const bag: ApexPictogram
export declare const book: ApexPictogram
export declare const cup: ApexPictogram
export declare const bulb: ApexPictogram
export declare const plane: ApexPictogram

/** Every glyph. Importing this ships all of them; import the one you use. */
export declare const catalog: ApexPictogram[]

export declare function definePictogram(meta: {
  name: string
  path: string
  viewBox?: [number, number, number, number]
  fillRule?: 'nonzero' | 'evenodd'
  category?: ApexPictogramCategory
  source?: 'original' | 'generated'
}): ApexPictogram

/** Register glyphs by name, so `pictogram: { mark: 'person' }` resolves. */
export declare function registerMarks(
  defs: ApexPictogram[] | Record<string, ApexPictogram>,
): string[]
export declare function unregisterMarks(names: string[] | string): void
export declare function registeredMarkNames(): string[]
