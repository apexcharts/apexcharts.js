"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.output = void 0;
const chalk = require("chalk");
const os_1 = require("os");
const readline = require("readline");
const is_ci_1 = require("./is-ci");
const GH_GROUP_PREFIX = '::group::';
const GH_GROUP_SUFFIX = '::endgroup::';
/**
 * Automatically disable styling applied by chalk if CI=true
 */
const forceColor = process.env.FORCE_COLOR === '' || process.env.FORCE_COLOR === 'true';
if ((0, is_ci_1.isCI)() && !forceColor) {
    chalk.level = 0;
}
class CLIOutput {
    constructor() {
        this.cliName = 'NX';
        this.formatCommand = (taskId) => `${chalk.dim('nx run')} ${taskId}`;
        /**
         * Expose some color and other utility functions so that other parts of the codebase that need
         * more fine-grained control of message bodies are still using a centralized
         * implementation.
         */
        this.colors = {
            gray: chalk.gray,
            green: chalk.green,
            red: chalk.red,
            cyan: chalk.cyan,
            white: chalk.white,
        };
        this.bold = chalk.bold;
        this.underline = chalk.underline;
        this.dim = chalk.dim;
    }
    /**
     * Longer dash character which forms more of a continuous line when place side to side
     * with itself, unlike the standard dash character
     */
    get VERTICAL_SEPARATOR() {
        let divider = '';
        for (let i = 0; i < process.stdout.columns - 1; i++) {
            divider += '\u2014';
        }
        return divider;
    }
    writeToStdOut(str) {
        process.stdout.write(str);
    }
    overwriteLine(lineText = '') {
        // this replaces the existing text up to the new line length
        process.stdout.write(lineText);
        // clear whatever text might be left to the right of the cursor (happens
        // when existing text was longer than new one)
        readline.clearLine(process.stdout, 1);
        process.stdout.write(os_1.EOL);
    }
    writeOutputTitle({ color, title, }) {
        this.writeToStdOut(`${this.applyNxPrefix(color, title)}${os_1.EOL}`);
    }
    writeOptionalOutputBody(bodyLines) {
        if (!bodyLines) {
            return;
        }
        this.addNewline();
        bodyLines.forEach((bodyLine) => this.writeToStdOut(`${bodyLine}${os_1.EOL}`));
    }
    applyNxPrefix(color = 'cyan', text) {
        let nxPrefix = '';
        if (chalk[color]) {
            nxPrefix = chalk.reset.inverse.bold[color](` ${this.cliName} `);
        }
        else {
            nxPrefix = chalk.reset.inverse.bold.keyword(color)(` ${this.cliName} `);
        }
        return `${nxPrefix}  ${text}`;
    }
    addNewline() {
        this.writeToStdOut(os_1.EOL);
    }
    addVerticalSeparator(color = 'gray') {
        this.addNewline();
        this.addVerticalSeparatorWithoutNewLines(color);
        this.addNewline();
    }
    addVerticalSeparatorWithoutNewLines(color = 'gray') {
        this.writeToStdOut(`${this.getVerticalSeparator(color)}${os_1.EOL}`);
    }
    getVerticalSeparatorLines(color = 'gray') {
        return ['', this.getVerticalSeparator(color), ''];
    }
    getVerticalSeparator(color) {
        return chalk.dim[color](this.VERTICAL_SEPARATOR);
    }
    error({ title, slug, bodyLines }) {
        this.addNewline();
        this.writeOutputTitle({
            color: 'red',
            title: chalk.red(title),
        });
        this.writeOptionalOutputBody(bodyLines);
        /**
         * Optional slug to be used in an Nx error message redirect URL
         */
        if (slug && typeof slug === 'string') {
            this.addNewline();
            this.writeToStdOut(`${chalk.grey('  Learn more about this error: ')}https://errors.nx.dev/${slug}${os_1.EOL}`);
        }
        this.addNewline();
    }
    warn({ title, slug, bodyLines }) {
        this.addNewline();
        this.writeOutputTitle({
            color: 'yellow',
            title: chalk.yellow(title),
        });
        this.writeOptionalOutputBody(bodyLines);
        /**
         * Optional slug to be used in an Nx warning message redirect URL
         */
        if (slug && typeof slug === 'string') {
            this.addNewline();
            this.writeToStdOut(`${chalk.grey('  Learn more about this warning: ')}https://errors.nx.dev/${slug}${os_1.EOL}`);
        }
        this.addNewline();
    }
    note({ title, bodyLines }) {
        this.addNewline();
        this.writeOutputTitle({
            color: 'orange',
            title: chalk.keyword('orange')(title),
        });
        this.writeOptionalOutputBody(bodyLines);
        this.addNewline();
    }
    success({ title, bodyLines }) {
        this.addNewline();
        this.writeOutputTitle({
            color: 'green',
            title: chalk.green(title),
        });
        this.writeOptionalOutputBody(bodyLines);
        this.addNewline();
    }
    logSingleLine(message) {
        this.addNewline();
        this.writeOutputTitle({
            color: 'gray',
            title: message,
        });
        this.addNewline();
    }
    logCommand(message, taskStatus) {
        this.addNewline();
        this.writeToStdOut(this.getCommandWithStatus(message, taskStatus));
        this.addNewline();
        this.addNewline();
    }
    logCommandOutput(message, taskStatus, output) {
        let commandOutputWithStatus = this.getCommandWithStatus(message, taskStatus);
        if (process.env.NX_SKIP_LOG_GROUPING !== 'true' &&
            process.env.GITHUB_ACTIONS) {
            const icon = this.getStatusIcon(taskStatus);
            commandOutputWithStatus = `${GH_GROUP_PREFIX}${icon} ${commandOutputWithStatus}`;
        }
        this.addNewline();
        this.writeToStdOut(commandOutputWithStatus);
        this.addNewline();
        this.addNewline();
        this.writeToStdOut(output);
        if (process.env.NX_SKIP_LOG_GROUPING !== 'true' &&
            process.env.GITHUB_ACTIONS) {
            this.writeToStdOut(GH_GROUP_SUFFIX);
        }
    }
    getCommandWithStatus(message, taskStatus) {
        const commandOutput = chalk.dim('> ') + this.formatCommand(this.normalizeMessage(message));
        return this.addTaskStatus(taskStatus, commandOutput);
    }
    getStatusIcon(taskStatus) {
        switch (taskStatus) {
            case 'success':
                return '✅';
            case 'failure':
                return '❌';
            case 'skipped':
            case 'local-cache-kept-existing':
                return '⏩';
            case 'local-cache':
            case 'remote-cache':
                return '🔁';
        }
    }
    normalizeMessage(message) {
        if (message.startsWith('nx run ')) {
            return message.substring('nx run '.length);
        }
        else if (message.startsWith('run ')) {
            return message.substring('run '.length);
        }
        else {
            return message;
        }
    }
    addTaskStatus(taskStatus, commandOutput) {
        if (taskStatus === 'local-cache') {
            return `${commandOutput}  ${chalk.dim('[local cache]')}`;
        }
        else if (taskStatus === 'remote-cache') {
            return `${commandOutput}  ${chalk.dim('[remote cache]')}`;
        }
        else if (taskStatus === 'local-cache-kept-existing') {
            return `${commandOutput}  ${chalk.dim('[existing outputs match the cache, left as is]')}`;
        }
        else {
            return commandOutput;
        }
    }
    log({ title, bodyLines, color }) {
        this.addNewline();
        this.writeOutputTitle({
            color: 'cyan',
            title: color ? chalk[color](title) : title,
        });
        this.writeOptionalOutputBody(bodyLines);
        this.addNewline();
    }
    drain() {
        return new Promise((resolve) => {
            if (process.stdout.writableNeedDrain) {
                process.stdout.once('drain', resolve);
            }
            else {
                resolve();
            }
        });
    }
}
exports.output = new CLIOutput();
