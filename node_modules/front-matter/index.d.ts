export interface FrontMatterResult<T> {
  readonly attributes: T
  readonly body: string
  readonly bodyBegin: number;
  readonly frontmatter?: string
}

export interface FrontMatterOptions {
  /**
   * Whether to use [safeload](https://github.com/nodeca/js-yaml#safeload-string---options-)
   * @default true
   */
  allowUnsafe?: boolean
}

interface FM {
  <T>(file: string, options?: FrontMatterOptions): FrontMatterResult<T>
  test(file: string): boolean
}

declare const fm: FM
export default fm