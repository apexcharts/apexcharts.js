export declare enum ChangeType {
    Delete = "Delete",
    Insert = "Insert"
}
export interface StringDeletion {
    type: ChangeType.Delete;
    /**
     * Place in the original text to start deleting characters
     */
    start: number;
    /**
     * Number of characters to delete
     */
    length: number;
}
export interface StringInsertion {
    type: ChangeType.Insert;
    /**
     * Text to insert into the original text
     */
    text: string;
    /**
     * Place in the original text to insert new text
     */
    index: number;
}
/**
 * A change to be made to a string
 */
export type StringChange = StringInsertion | StringDeletion;
/**
 * Applies a list of changes to a string's original value.
 *
 * This is useful when working with ASTs.
 *
 * For Example, to rename a property in a method's options:
 *
 * ```typescript
 * const code = `bootstrap({
 *   target: document.querySelector('#app')
 * })`;
 *
 * const indexOfPropertyName = 13; // Usually determined by analyzing an AST.
 * const updatedCode = applyChangesToString(code, [
 *   {
 *     type: ChangeType.Insert,
 *     index: indexOfPropertyName,
 *     text: 'element'
 *   },
 *   {
 *     type: ChangeType.Delete,
 *     start: indexOfPropertyName,
 *     length: 6
 *   },
 * ]);
 *
 * bootstrap({
 *   element: document.querySelector('#app')
 * });
 * ```
 */
export declare function applyChangesToString(text: string, changes: StringChange[]): string;
