"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupTsConfig = setupTsConfig;
const path_1 = require("path");
const fileutils_1 = require("../../../../utils/fileutils");
const defaultTsConfig = (relativePathToRoot) => ({
    extends: relativePathToRoot
        ? (0, path_1.join)(relativePathToRoot, 'tsconfig.base.json')
        : './tsconfig.base.json',
    compilerOptions: {
        jsx: 'react',
        allowJs: true,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
    },
    files: [],
    include: [],
    references: [
        {
            path: './tsconfig.app.json',
        },
        {
            path: './tsconfig.spec.json',
        },
    ],
});
const defaultTsConfigApp = (relativePathToRoot) => ({
    extends: './tsconfig.json',
    compilerOptions: {
        outDir: (0, path_1.join)(relativePathToRoot, 'dist/out-tsc'),
        types: ['node'],
    },
    files: [
        (0, path_1.join)(relativePathToRoot, 'node_modules/@nx/react/typings/cssmodule.d.ts'),
        (0, path_1.join)(relativePathToRoot, 'node_modules/@nx/react/typings/image.d.ts'),
    ],
    exclude: ['**/*.spec.ts', '**/*.spec.tsx'],
    include: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
});
const defaultTsConfigSpec = (relativePathToRoot) => ({
    extends: './tsconfig.json',
    compilerOptions: {
        outDir: (0, path_1.join)(relativePathToRoot, 'dist/out-tsc'),
        module: 'commonjs',
        types: ['jest', 'node'],
    },
    include: [
        '**/*.spec.ts',
        '**/*.spec.tsx',
        '**/*.spec.js',
        '**/*.spec.jsx',
        '**/*.d.ts',
    ],
    files: [
        (0, path_1.join)(relativePathToRoot, 'node_modules/@nx/react/typings/cssmodule.d.ts'),
        (0, path_1.join)(relativePathToRoot, 'node_modules/@nx/react/typings/image.d.ts'),
    ],
});
function setupTsConfig(appName, isStandalone) {
    const tsconfigPath = isStandalone
        ? 'tsconfig.json'
        : `apps/${appName}/tsconfig.json`;
    const tsconfigAppPath = isStandalone
        ? 'tsconfig.app.json'
        : `apps/${appName}/tsconfig.app.json`;
    const tsconfiSpecPath = isStandalone
        ? 'tsconfig.spec.json'
        : `apps/${appName}/tsconfig.spec.json`;
    const tsconfigBasePath = isStandalone
        ? './tsconfig.base.json'
        : '../../tsconfig.base.json';
    const relativePathToRoot = isStandalone ? '' : '../../';
    if ((0, fileutils_1.fileExists)(tsconfigPath)) {
        const json = (0, fileutils_1.readJsonFile)(tsconfigPath);
        json.extends = tsconfigBasePath;
        if (json.compilerOptions) {
            json.compilerOptions.jsx = 'react';
        }
        else {
            json.compilerOptions = {
                jsx: 'react',
                allowJs: true,
                esModuleInterop: true,
                allowSyntheticDefaultImports: true,
            };
        }
        (0, fileutils_1.writeJsonFile)(tsconfigPath, json);
    }
    else {
        (0, fileutils_1.writeJsonFile)(tsconfigPath, defaultTsConfig(relativePathToRoot));
    }
    if ((0, fileutils_1.fileExists)(tsconfigAppPath)) {
        const json = (0, fileutils_1.readJsonFile)(tsconfigAppPath);
        json.extends = './tsconfig.json';
        (0, fileutils_1.writeJsonFile)(tsconfigAppPath, json);
    }
    else {
        (0, fileutils_1.writeJsonFile)(tsconfigAppPath, defaultTsConfigApp(relativePathToRoot));
    }
    if ((0, fileutils_1.fileExists)(tsconfiSpecPath)) {
        const json = (0, fileutils_1.readJsonFile)(tsconfiSpecPath);
        json.extends = './tsconfig.json';
        (0, fileutils_1.writeJsonFile)(tsconfiSpecPath, json);
    }
    else {
        (0, fileutils_1.writeJsonFile)(tsconfiSpecPath, defaultTsConfigSpec(relativePathToRoot));
    }
}
