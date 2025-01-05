"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PseudoTtyProcess = void 0;
exports.runNxSync = runNxSync;
exports.runNxAsync = runNxAsync;
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path_1 = require("path");
const package_manager_1 = require("./package-manager");
const workspace_root_1 = require("./workspace-root");
function runNxSync(cmd, options) {
    let baseCmd;
    if ((0, fs_1.existsSync)((0, path_1.join)(workspace_root_1.workspaceRoot, 'package.json'))) {
        baseCmd = `${(0, package_manager_1.getPackageManagerCommand)().exec} nx`;
    }
    else {
        options ??= {};
        options.cwd ??= process.cwd();
        options.windowsHide ??= true;
        const offsetFromRoot = (0, path_1.relative)(options.cwd, (0, workspace_root_1.workspaceRootInner)(options.cwd, null));
        if (process.platform === 'win32') {
            baseCmd = '.\\' + (0, path_1.join)(`${offsetFromRoot}`, 'nx.bat');
        }
        else {
            baseCmd = './' + (0, path_1.join)(`${offsetFromRoot}`, 'nx');
        }
    }
    (0, child_process_1.execSync)(`${baseCmd} ${cmd}`, options);
}
async function runNxAsync(cmd, options) {
    let baseCmd;
    if ((0, fs_1.existsSync)((0, path_1.join)(workspace_root_1.workspaceRoot, 'package.json'))) {
        baseCmd = `${(0, package_manager_1.getPackageManagerCommand)().exec} nx`;
    }
    else {
        options ??= {};
        options.cwd ??= process.cwd();
        options.windowsHide ??= true;
        const offsetFromRoot = (0, path_1.relative)(options.cwd, (0, workspace_root_1.workspaceRootInner)(options.cwd, null));
        if (process.platform === 'win32') {
            baseCmd = '.\\' + (0, path_1.join)(`${offsetFromRoot}`, 'nx.bat');
        }
        else {
            baseCmd = './' + (0, path_1.join)(`${offsetFromRoot}`, 'nx');
        }
    }
    const silent = options?.silent ?? true;
    if (options?.silent) {
        delete options.silent;
    }
    return new Promise((resolve, reject) => {
        const child = (0, child_process_1.exec)(`${baseCmd} ${cmd}`, options, (error, stdout, stderr) => {
            if (error) {
                reject(stderr || stdout || error.message);
            }
            else {
                resolve();
            }
        });
        if (!silent) {
            child.stdout?.pipe(process.stdout);
            child.stderr?.pipe(process.stderr);
        }
    });
}
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
