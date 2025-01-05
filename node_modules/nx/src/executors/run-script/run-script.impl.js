"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const path = require("path");
const package_manager_1 = require("../../utils/package-manager");
const child_process_1 = require("child_process");
const pseudo_terminal_1 = require("../../tasks-runner/pseudo-terminal");
async function default_1(options, context) {
    const pm = (0, package_manager_1.getPackageManagerCommand)();
    try {
        let command = pm.run(options.script, options.__unparsed__.join(' '));
        let cwd = path.join(context.root, context.projectsConfigurations.projects[context.projectName].root);
        let env = process.env;
        // when running nx through npx with node_modules installed with npm, the path gets modified to include the full workspace path with the node_modules folder
        // This causes issues when running in a pty process, so we filter out the node_modules paths from the PATH
        // Since the command here will be run with the package manager script command, the path will be modified again within the PTY process itself.
        let filteredPath = env.PATH?.split(path.delimiter)
            .filter((p) => !p.startsWith(path.join(context.root, 'node_modules')))
            .join(path.delimiter) ?? '';
        env.PATH = filteredPath;
        if (pseudo_terminal_1.PseudoTerminal.isSupported()) {
            await ptyProcess(command, cwd, env);
        }
        else {
            nodeProcess(command, cwd, env);
        }
        return { success: true };
    }
    catch (e) {
        return { success: false };
    }
}
function nodeProcess(command, cwd, env) {
    (0, child_process_1.execSync)(command, {
        stdio: ['inherit', 'inherit', 'inherit'],
        cwd,
        env,
        windowsHide: false,
    });
}
async function ptyProcess(command, cwd, env) {
    const terminal = (0, pseudo_terminal_1.getPseudoTerminal)();
    return new Promise((res, rej) => {
        const cp = terminal.runCommand(command, { cwd, jsEnv: env });
        cp.onExit((code) => {
            if (code === 0) {
                res();
            }
            else if (code >= 128) {
                process.exit(code);
            }
            else {
                rej();
            }
        });
    });
}
