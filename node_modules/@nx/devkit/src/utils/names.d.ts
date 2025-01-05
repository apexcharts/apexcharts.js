/**
 * Util function to generate different strings based off the provided name.
 *
 * Examples:
 *
 * ```typescript
 * names("my-name") // {name: 'my-name', className: 'MyName', propertyName: 'myName', constantName: 'MY_NAME', fileName: 'my-name'}
 * names("myName") // {name: 'myName', className: 'MyName', propertyName: 'myName', constantName: 'MY_NAME', fileName: 'my-name'}
 * ```
 * @param name
 */
export declare function names(name: string): {
    name: string;
    className: string;
    propertyName: string;
    constantName: string;
    fileName: string;
};
