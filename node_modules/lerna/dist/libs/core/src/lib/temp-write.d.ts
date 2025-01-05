declare function tempWrite(fileContent: any, filePath?: string): Promise<string>;
declare namespace tempWrite {
    var sync: (fileContent: any, filePath?: string) => string;
}
export default tempWrite;
