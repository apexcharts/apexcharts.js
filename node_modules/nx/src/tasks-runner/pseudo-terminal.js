"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PseudoTtyProcessWithSend = exports.PseudoTtyProcess = exports.PseudoTerminal = void 0;
exports.getPseudoTerminal = getPseudoTerminal;
const native_1 = require("../native");
const pseudo_ipc_1 = require("./pseudo-ipc");
const socket_utils_1 = require("../daemon/socket-utils");
const os = require("os");
let pseudoTerminal;
function getPseudoTerminal(skipSupportCheck = false) {
    if (!skipSupportCheck && !PseudoTerminal.isSupported()) {
        throw new Error('Pseudo terminal is not supported on this platform.');
    }
    pseudoTerminal ??= new PseudoTerminal(new native_1.RustPseudoTerminal());
    return pseudoTerminal;
}
class PseudoTerminal {
    static isSupported() {
        return process.stdout.isTTY && supportedPtyPlatform();
    }
    constructor(rustPseudoTerminal) {
        this.rustPseudoTerminal = rustPseudoTerminal;
        this.pseudoIPCPath = (0, socket_utils_1.getForkedProcessOsSocketPath)(process.pid.toString());
        this.pseudoIPC = new pseudo_ipc_1.PseudoIPCServer(this.pseudoIPCPath);
        this.initialized = false;
        this.setupProcessListeners();
    }
    async init() {
        if (this.initialized) {
            return;
        }
        await this.pseudoIPC.init();
        this.initialized = true;
    }
    runCommand(command, { cwd, execArgv, jsEnv, quiet, tty, } = {}) {
        return new PseudoTtyProcess(this.rustPseudoTerminal.runCommand(command, cwd, jsEnv, execArgv, quiet, tty));
    }
    async fork(id, script, { cwd, execArgv, jsEnv, quiet, }) {
        if (!this.initialized) {
            throw new Error('Call init() before forking processes');
        }
        const cp = new PseudoTtyProcessWithSend(this.rustPseudoTerminal.fork(id, script, this.pseudoIPCPath, cwd, jsEnv, execArgv, quiet), id, this.pseudoIPC);
        await this.pseudoIPC.waitForChildReady(id);
        return cp;
    }
    sendMessageToChildren(message) {
        this.pseudoIPC.sendMessageToChildren(message);
    }
    onMessageFromChildren(callback) {
        this.pseudoIPC.onMessageFromChildren(callback);
    }
    setupProcessListeners() {
        const shutdown = () => {
            this.shutdownPseudoIPC();
        };
        process.on('SIGINT', () => {
            this.shutdownPseudoIPC();
        });
        process.on('SIGTERM', () => {
            this.shutdownPseudoIPC();
        });
        process.on('SIGHUP', () => {
            this.shutdownPseudoIPC();
        });
        process.on('exit', () => {
            this.shutdownPseudoIPC();
        });
    }
    shutdownPseudoIPC() {
        if (this.initialized) {
            this.pseudoIPC.close();
        }
    }
}
exports.PseudoTerminal = PseudoTerminal;
class PseudoTtyProcess {
    constructor(childProcess) {
        this.childProcess = childProcess;
        this.isAlive = true;
        this.exitCallbacks = [];
        childProcess.onExit((message) => {
            this.isAlive = false;
            const exitCode = messageToCode(message);
            this.exitCallbacks.forEach((cb) => cb(exitCode));
        });
    }
    onExit(callback) {
        this.exitCallbacks.push(callback);
    }
    onOutput(callback) {
        this.childProcess.onOutput(callback);
    }
    kill() {
        try {
            this.childProcess.kill();
        }
        catch {
            // when the child process completes before we explicitly call kill, this will throw
            // do nothing
        }
        finally {
            if (this.isAlive == true) {
                this.isAlive = false;
            }
        }
    }
}
exports.PseudoTtyProcess = PseudoTtyProcess;
class PseudoTtyProcessWithSend extends PseudoTtyProcess {
    constructor(_childProcess, id, pseudoIpc) {
        super(_childProcess);
        this.id = id;
        this.pseudoIpc = pseudoIpc;
    }
    send(message) {
        this.pseudoIpc.sendMessageToChild(this.id, message);
    }
}
exports.PseudoTtyProcessWithSend = PseudoTtyProcessWithSend;
function messageToCode(message) {
    if (message.startsWith('Terminated by ')) {
        switch (message.replace('Terminated by ', '').trim()) {
            case 'Termination':
                return 143;
            case 'Interrupt':
                return 130;
            default:
                return 128;
        }
    }
    else if (message.startsWith('Exited with code ')) {
        return parseInt(message.replace('Exited with code ', '').trim());
    }
    else if (message === 'Success') {
        return 0;
    }
    else {
        return 1;
    }
}
function supportedPtyPlatform() {
    if (native_1.IS_WASM) {
        return false;
    }
    if (process.platform !== 'win32') {
        return true;
    }
    // TODO: Re-enable Windows support when it's stable
    // Currently, there's an issue with control chars.
    // See: https://github.com/nrwl/nx/issues/22358
    if (process.env.NX_WINDOWS_PTY_SUPPORT !== 'true') {
        return false;
    }
    let windowsVersion = os.release().split('.');
    let windowsBuild = windowsVersion[2];
    if (!windowsBuild) {
        return false;
    }
    // Mininum supported Windows version:
    // https://en.wikipedia.org/wiki/Windows_10,_version_1809
    // https://learn.microsoft.com/en-us/windows/console/createpseudoconsole#requirements
    if (+windowsBuild < 17763) {
        return false;
    }
    else {
        return true;
    }
}
