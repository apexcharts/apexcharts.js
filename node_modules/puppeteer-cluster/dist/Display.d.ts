export default class Display {
    private lastLinesCount;
    private linesCount;
    log(str: string): Promise<void>;
    resetCursor(): Promise<void>;
    close(): void;
}
