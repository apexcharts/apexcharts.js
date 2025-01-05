"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const CLEAR_LINE = '\x1B[K';
class Display {
    constructor() {
        this.lastLinesCount = 0;
        this.linesCount = 0;
    }
    log(str) {
        return __awaiter(this, void 0, void 0, function* () {
            // We create an empty line at the start so that any console.log calls
            // from within the script are above our output.
            if (this.linesCount === 0) {
                console.log(CLEAR_LINE); // erases the current line
                this.linesCount += 1;
            }
            // Strip lines that are too long
            const strToLog = str.substr(0, 78);
            console.log(`${CLEAR_LINE}${strToLog}`);
            this.linesCount += 1;
        });
    }
    resetCursor() {
        return __awaiter(this, void 0, void 0, function* () {
            // move cursor up to draw over out output
            process.stdout.write(`\x1B[${this.linesCount}A`);
            this.lastLinesCount = this.linesCount;
            this.linesCount = 0;
        });
    }
    close() {
        // move cursor down so that console output stays
        process.stdout.write(`\x1B[${this.lastLinesCount}B`);
    }
}
exports.default = Display;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGlzcGxheS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9EaXNwbGF5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQ0EsTUFBTSxVQUFVLEdBQUcsUUFBUSxDQUFDO0FBRTVCLE1BQXFCLE9BQU87SUFBNUI7UUFFWSxtQkFBYyxHQUFXLENBQUMsQ0FBQztRQUMzQixlQUFVLEdBQVcsQ0FBQyxDQUFDO0lBNEJuQyxDQUFDO0lBMUJnQixHQUFHLENBQUMsR0FBVzs7WUFDeEIscUVBQXFFO1lBQ3JFLCtDQUErQztZQUMvQyxJQUFJLElBQUksQ0FBQyxVQUFVLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ3hCLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQywwQkFBMEI7Z0JBQ25ELElBQUksQ0FBQyxVQUFVLElBQUksQ0FBQyxDQUFDO1lBQ3pCLENBQUM7WUFFRCxnQ0FBZ0M7WUFDaEMsTUFBTSxRQUFRLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDbkMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsR0FBRyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQ3hDLElBQUksQ0FBQyxVQUFVLElBQUksQ0FBQyxDQUFDO1FBQ3pCLENBQUM7S0FBQTtJQUVZLFdBQVc7O1lBQ3BCLHlDQUF5QztZQUN6QyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxRQUFRLElBQUksQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDO1lBQ2pELElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQztZQUN0QyxJQUFJLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQztRQUN4QixDQUFDO0tBQUE7SUFFTSxLQUFLO1FBQ1IsZ0RBQWdEO1FBQ2hELE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFFBQVEsSUFBSSxDQUFDLGNBQWMsR0FBRyxDQUFDLENBQUM7SUFDekQsQ0FBQztDQUVKO0FBL0JELDBCQStCQyJ9