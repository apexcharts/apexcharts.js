/**
 * Types for `apexcharts/unit-shapes`.
 *
 * Deliberately standalone: the structural types below mirror the unit-layout
 * contract in `apexcharts.d.ts` rather than importing it, so the shape
 * collection can be consumed (or one day extracted) without pulling the chart's
 * whole declaration file into a project's type graph.
 */

export type ApexUnitShapeCategory =
  | 'nature'
  | 'objects'
  | 'people'
  | 'business'
  | 'technology'
  | 'symbols'
  | 'geography'

/** Which slots the first category takes, and so where its band lands. */
export type ApexUnitShapeOrder =
  | 'rows'
  | 'rowsUp'
  | 'cols'
  | 'colsRev'
  | 'centerOut'
  | 'centerIn'

/** One mark, as the chart hands it to a layout. */
export interface ApexUnitShapeObject {
  id: string
  index: number
  seriesIndex: number
  dataPointIndex: number
  label: string
  value?: number
  datum: any
  /** The radius the chart chose. */
  r: number
}

export interface ApexUnitShapeRect {
  x: number
  y: number
  width: number
  height: number
}

export interface ApexUnitShapePosition {
  id: string
  x: number
  y: number
  r?: number
}

export interface ApexUnitShapeMeta {
  /** Registered name and export name. Frozen: renaming is a breaking change. */
  name: string
  category?: ApexUnitShapeCategory
  /** Below this count the shape stops reading; warns in development. */
  minUnits?: number
  kind?: 'silhouette' | 'stroke' | 'rings' | 'globe' | 'tiers'
  /** The outline for silhouettes, the centreline for strokes. */
  path?: string
  /** Stroke thickness in path units, for strokes (16). */
  width?: number
  order?: ApexUnitShapeOrder
  /** Share of the plot rect to fill (0.94). */
  padding?: number
  /** Row gap over in-row gap (0.88, roughly hexagonal). */
  rowRatio?: number
  fillRule?: 'nonzero' | 'evenodd'
  /** Outline sampling step, in path units (0.6). */
  sampling?: number
  /** Globe only: degrees the pole leans towards the viewer. */
  tilt?: number
  /** Rings only: radians of rotation per ring. */
  twist?: number
  /**
   * Provenance. `'original'` means the outline was authored in this repo;
   * `'generated'` means there is no outline and the positions come from maths.
   * No third-party path is admitted to the catalog, permissive licence or not,
   * because the outline ships verbatim inside the bundle.
   */
  source?: 'original' | 'generated'
  lint?: { minSeparation?: number }
}

/**
 * A shape is a callable layout, so it can be handed straight to
 * `plotOptions.unit.positions` with no registration step.
 */
export interface ApexUnitShape {
  (
    objects: ApexUnitShapeObject[],
    rect: ApexUnitShapeRect,
  ): ApexUnitShapePosition[]
  /** The shape's definition, for docs, previews and tests. */
  readonly shape: Readonly<ApexUnitShapeMeta>
  /** A variant. The original is unchanged. */
  with(overrides: Partial<ApexUnitShapeMeta>): ApexUnitShape
}

// nature
export const droplet: ApexUnitShape
export const tree: ApexUnitShape
export const leaf: ApexUnitShape
export const sun: ApexUnitShape
export const flame: ApexUnitShape
export const fish: ApexUnitShape

// objects
export const house: ApexUnitShape
export const battery: ApexUnitShape
export const rocket: ApexUnitShape
export const bulb: ApexUnitShape
export const flask: ApexUnitShape
export const car: ApexUnitShape
export const plane: ApexUnitShape

// people & society
export const human: ApexUnitShape
export const group: ApexUnitShape

// business
export const target: ApexUnitShape
export const trophy: ApexUnitShape
export const moneybag: ApexUnitShape
export const funnel: ApexUnitShape

// technology
export const shield: ApexUnitShape
export const gear: ApexUnitShape
export const robot: ApexUnitShape
export const wifi: ApexUnitShape
export const pulse: ApexUnitShape

// symbols
export const heart: ApexUnitShape
export const pyramid: ApexUnitShape
export const star: ApexUnitShape
export const arrow: ApexUnitShape
export const crown: ApexUnitShape
export const cross: ApexUnitShape
export const bolt: ApexUnitShape
export const check: ApexUnitShape
export const xmark: ApexUnitShape
export const percent: ApexUnitShape
export const question: ApexUnitShape
export const spiral: ApexUnitShape

// geography
export const globe: ApexUnitShape
export const pin: ApexUnitShape
export const mountain: ApexUnitShape

/**
 * Every shipped shape. Importing this pulls the whole collection in, so it is
 * for galleries and tests rather than charts.
 */
export const catalog: ApexUnitShape[]

/** Register shapes so `positions: '<name>'` resolves. Returns the names. */
export function registerShapes(
  shapes: ApexUnitShape[] | Record<string, ApexUnitShape>,
): string[]
export function unregisterShapes(names: string[] | string): void
export function registeredShapeNames(): string[]

/** Your own outline, packed the same way as the catalog's. */
export function shapeFrom(
  path: string,
  opts?: Partial<ApexUnitShapeMeta>,
): ApexUnitShape

/** Your own centreline, for a thing that is a line rather than an area. */
export function strokeFrom(
  path: string,
  opts?: Partial<ApexUnitShapeMeta>,
): ApexUnitShape

/**
 * The hollow version of a filled shape: trace its outline instead of filling it.
 * Throws for the generated shapes (rings, globe, tiers), which have no path.
 */
export function outlined(shape: ApexUnitShape, width?: number): ApexUnitShape

/**
 * A number as a shape, so the dots spell out how many there are.
 * Accepts digits plus "-", ".", "," and ":".
 */
export function glyphs(
  text: string | number,
  opts?: Partial<ApexUnitShapeMeta> & { gap?: number },
): ApexUnitShape

/** The seven-segment centreline behind `glyphs`, if you want it directly. */
export function digitsPath(text: string | number, gap?: number): string

/** Render a shape to an SVG string, with no chart and no DOM. */
export function preview(
  shape: ApexUnitShape,
  opts?: {
    count?: number
    /**
     * Series values, coloured band by band the way the chart colours them, and
     * the default for `count`. Pass this whenever the preview stands in for a
     * real chart: one flat colour says the categories cannot be told apart.
     */
    series?: number[]
    width?: number
    height?: number
    padding?: number
    fill?: string | string[]
    r?: number
    svg?: boolean
  },
): string

/** The factories behind the catalog, for shapes of your own. */
export function silhouette(meta: ApexUnitShapeMeta): ApexUnitShape
export function stroke(meta: ApexUnitShapeMeta): ApexUnitShape
export function rings(meta: ApexUnitShapeMeta): ApexUnitShape
export function sphere(meta: ApexUnitShapeMeta): ApexUnitShape
export function tiers(meta: ApexUnitShapeMeta): ApexUnitShape
