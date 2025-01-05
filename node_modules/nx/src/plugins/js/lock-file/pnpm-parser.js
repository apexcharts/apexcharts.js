"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPnpmLockfileNodes = getPnpmLockfileNodes;
exports.getPnpmLockfileDependencies = getPnpmLockfileDependencies;
exports.stringifyPnpmLockfile = stringifyPnpmLockfile;
const pnpm_normalizer_1 = require("./utils/pnpm-normalizer");
const package_json_1 = require("./utils/package-json");
const object_sort_1 = require("../../../utils/object-sort");
const project_graph_builder_1 = require("../../../project-graph/project-graph-builder");
const project_graph_1 = require("../../../config/project-graph");
const file_hasher_1 = require("../../../hasher/file-hasher");
// we use key => node map to avoid duplicate work when parsing keys
let keyMap = new Map();
let currentLockFileHash;
let parsedLockFile;
function parsePnpmLockFile(lockFileContent, lockFileHash) {
    if (lockFileHash === currentLockFileHash) {
        return parsedLockFile;
    }
    keyMap.clear();
    const results = (0, pnpm_normalizer_1.parseAndNormalizePnpmLockfile)(lockFileContent);
    parsedLockFile = results;
    currentLockFileHash = lockFileHash;
    return results;
}
function getPnpmLockfileNodes(lockFileContent, lockFileHash) {
    const data = parsePnpmLockFile(lockFileContent, lockFileHash);
    if (+data.lockfileVersion.toString() >= 10) {
        console.warn('Nx was tested only with pnpm lockfile version 5-9. If you encounter any issues, please report them and downgrade to older version of pnpm.');
    }
    const isV5 = (0, pnpm_normalizer_1.isV5Syntax)(data);
    return getNodes(data, keyMap, isV5);
}
function getPnpmLockfileDependencies(lockFileContent, lockFileHash, ctx) {
    const data = parsePnpmLockFile(lockFileContent, lockFileHash);
    if (+data.lockfileVersion.toString() >= 10) {
        console.warn('Nx was tested only with pnpm lockfile version 5-9. If you encounter any issues, please report them and downgrade to older version of pnpm.');
    }
    const isV5 = (0, pnpm_normalizer_1.isV5Syntax)(data);
    return getDependencies(data, keyMap, isV5, ctx);
}
function matchPropValue(record, key, originalPackageName) {
    if (!record) {
        return undefined;
    }
    const index = Object.values(record).findIndex((version) => version === key);
    if (index > -1) {
        return Object.keys(record)[index];
    }
    // check if non-aliased name is found
    if (record[originalPackageName] &&
        key.startsWith(`/${originalPackageName}/${record[originalPackageName]}`)) {
        return originalPackageName;
    }
}
function matchedDependencyName(importer, key, originalPackageName) {
    return (matchPropValue(importer.dependencies, key, originalPackageName) ||
        matchPropValue(importer.optionalDependencies, key, originalPackageName) ||
        matchPropValue(importer.peerDependencies, key, originalPackageName));
}
function createHashFromSnapshot(snapshot) {
    return (snapshot.resolution?.['integrity'] ||
        (snapshot.resolution?.['tarball']
            ? (0, file_hasher_1.hashArray)([snapshot.resolution['tarball']])
            : undefined));
}
function isAliasVersion(depVersion) {
    return depVersion.startsWith('/') || depVersion.includes('@');
}
function getNodes(data, keyMap, isV5) {
    const nodes = new Map();
    const maybeAliasedPackageVersions = new Map(); // <version, alias>
    if (data.importers['.'].optionalDependencies) {
        for (const [depName, depVersion] of Object.entries(data.importers['.'].optionalDependencies)) {
            if (isAliasVersion(depVersion)) {
                maybeAliasedPackageVersions.set(depVersion, depName);
            }
        }
    }
    if (data.importers['.'].devDependencies) {
        for (const [depName, depVersion] of Object.entries(data.importers['.'].devDependencies)) {
            if (isAliasVersion(depVersion)) {
                maybeAliasedPackageVersions.set(depVersion, depName);
            }
        }
    }
    if (data.importers['.'].dependencies) {
        for (const [depName, depVersion] of Object.entries(data.importers['.'].dependencies)) {
            if (isAliasVersion(depVersion)) {
                maybeAliasedPackageVersions.set(depVersion, depName);
            }
        }
    }
    const packageNames = new Set();
    let packageNameObj;
    for (const [key, snapshot] of Object.entries(data.packages)) {
        const originalPackageName = extractNameFromKey(key, isV5);
        if (!originalPackageName) {
            continue;
        }
        const hash = createHashFromSnapshot(snapshot);
        // snapshot already has a name
        if (snapshot.name) {
            packageNameObj = {
                key,
                packageName: snapshot.name,
                hash,
            };
        }
        const rootDependencyName = matchedDependencyName(data.importers['.'], key, originalPackageName) ||
            matchedDependencyName(data.importers['.'], `/${key}`, originalPackageName) ||
            // only root importers have devDependencies
            matchPropValue(data.importers['.'].devDependencies, key, originalPackageName) ||
            matchPropValue(data.importers['.'].devDependencies, `/${key}`, originalPackageName);
        if (rootDependencyName) {
            packageNameObj = {
                key,
                packageName: rootDependencyName,
                hash: createHashFromSnapshot(snapshot),
            };
        }
        if (!snapshot.name && !rootDependencyName) {
            packageNameObj = {
                key,
                packageName: originalPackageName,
                hash: createHashFromSnapshot(snapshot),
            };
        }
        if (snapshot.peerDependencies) {
            for (const [depName, depVersion] of Object.entries(snapshot.peerDependencies)) {
                if (isAliasVersion(depVersion)) {
                    maybeAliasedPackageVersions.set(depVersion, depName);
                }
            }
        }
        if (snapshot.optionalDependencies) {
            for (const [depName, depVersion] of Object.entries(snapshot.optionalDependencies)) {
                if (isAliasVersion(depVersion)) {
                    maybeAliasedPackageVersions.set(depVersion, depName);
                }
            }
        }
        if (snapshot.dependencies) {
            for (const [depName, depVersion] of Object.entries(snapshot.dependencies)) {
                if (isAliasVersion(depVersion)) {
                    maybeAliasedPackageVersions.set(depVersion, depName);
                }
            }
        }
        const aliasedDep = maybeAliasedPackageVersions.get(`/${key}`);
        if (aliasedDep) {
            packageNameObj = {
                key,
                packageName: aliasedDep,
                hash,
                alias: true,
            };
        }
        packageNames.add(packageNameObj);
        const localAlias = maybeAliasedPackageVersions.get(key);
        if (localAlias) {
            packageNameObj = {
                key,
                packageName: localAlias,
                hash,
                alias: true,
            };
            packageNames.add(packageNameObj);
        }
    }
    for (const { key, packageName, hash, alias } of packageNames) {
        const rawVersion = findVersion(key, packageName, isV5, alias);
        if (!rawVersion) {
            continue;
        }
        const version = parseBaseVersion(rawVersion, isV5);
        if (!version) {
            continue;
        }
        if (!nodes.has(packageName)) {
            nodes.set(packageName, new Map());
        }
        if (!nodes.get(packageName).has(version)) {
            const node = {
                type: 'npm',
                name: version && !version.startsWith('npm:')
                    ? `npm:${packageName}@${version}`
                    : `npm:${packageName}`,
                data: {
                    version,
                    packageName,
                    hash: hash ?? (0, file_hasher_1.hashArray)([packageName, version]),
                },
            };
            nodes.get(packageName).set(version, node);
            if (!keyMap.has(key)) {
                keyMap.set(key, new Set([node]));
            }
            else {
                keyMap.get(key).add(node);
            }
        }
        else {
            const node = nodes.get(packageName).get(version);
            if (!keyMap.has(key)) {
                keyMap.set(key, new Set([node]));
            }
            else {
                keyMap.get(key).add(node);
            }
        }
    }
    const hoistedDeps = (0, pnpm_normalizer_1.loadPnpmHoistedDepsDefinition)();
    const results = {};
    for (const [packageName, versionMap] of nodes.entries()) {
        let hoistedNode;
        if (versionMap.size === 1) {
            hoistedNode = versionMap.values().next().value;
        }
        else {
            const hoistedVersion = getHoistedVersion(hoistedDeps, packageName, isV5);
            hoistedNode = versionMap.get(hoistedVersion);
        }
        if (hoistedNode) {
            hoistedNode.name = `npm:${packageName}`;
        }
        versionMap.forEach((node) => {
            results[node.name] = node;
        });
    }
    return results;
}
function getHoistedVersion(hoistedDependencies, packageName, isV5) {
    let version = (0, package_json_1.getHoistedPackageVersion)(packageName);
    if (!version) {
        const key = Object.keys(hoistedDependencies).find((k) => k.startsWith(`/${packageName}/`));
        if (key) {
            version = parseBaseVersion(getVersion(key.slice(1), packageName), isV5);
        }
        else {
            // pnpm might not hoist every package
            // similarly those packages will not be available to be used via import
            return;
        }
    }
    return version;
}
function getDependencies(data, keyMap, isV5, ctx) {
    const results = [];
    Object.entries(data.packages).forEach(([key, snapshot]) => {
        const nodes = keyMap.get(key);
        nodes.forEach((node) => {
            [snapshot.dependencies, snapshot.optionalDependencies].forEach((section) => {
                if (section) {
                    Object.entries(section).forEach(([name, versionRange]) => {
                        const version = parseBaseVersion(findVersion(versionRange, name, isV5), isV5);
                        const target = ctx.externalNodes[`npm:${name}@${version}`] ||
                            ctx.externalNodes[`npm:${name}`];
                        if (target) {
                            const dep = {
                                source: node.name,
                                target: target.name,
                                type: project_graph_1.DependencyType.static,
                            };
                            (0, project_graph_builder_1.validateDependency)(dep, ctx);
                            results.push(dep);
                        }
                    });
                }
            });
        });
    });
    return results;
}
function parseBaseVersion(rawVersion, isV5) {
    return isV5 ? rawVersion.split('_')[0] : rawVersion.split('(')[0];
}
function stringifyPnpmLockfile(graph, rootLockFileContent, packageJson) {
    const data = (0, pnpm_normalizer_1.parseAndNormalizePnpmLockfile)(rootLockFileContent);
    const { lockfileVersion, packages } = data;
    const rootSnapshot = mapRootSnapshot(packageJson, packages, graph.externalNodes, +lockfileVersion);
    const snapshots = mapSnapshots(data.packages, graph.externalNodes, +lockfileVersion);
    const output = {
        ...data,
        lockfileVersion,
        importers: {
            '.': rootSnapshot,
        },
        packages: (0, object_sort_1.sortObjectByKeys)(snapshots),
    };
    return (0, pnpm_normalizer_1.stringifyToPnpmYaml)(output);
}
function mapSnapshots(packages, nodes, lockfileVersion) {
    const result = {};
    Object.values(nodes).forEach((node) => {
        const matchedKeys = findOriginalKeys(packages, node, lockfileVersion, {
            returnFullKey: true,
        });
        // the package manager doesn't check for types of dependencies
        // so we can safely set all to prod
        matchedKeys.forEach(([key, snapshot]) => {
            if (lockfileVersion >= 9) {
                delete snapshot['dev'];
                result[key] = snapshot;
            }
            else {
                snapshot['dev'] = false; // all dependencies are prod
                remapDependencies(snapshot);
                if (snapshot.resolution?.['tarball']) {
                    // tarballs are not prefixed with /
                    result[key] = snapshot;
                }
                else {
                    result[`/${key}`] = snapshot;
                }
            }
        });
    });
    return result;
}
function remapDependencies(snapshot) {
    [
        'dependencies',
        'optionalDependencies',
        'devDependencies',
        'peerDependencies',
    ].forEach((depType) => {
        if (snapshot[depType]) {
            for (const [packageName, version] of Object.entries(snapshot[depType])) {
                if (version.match(/^[a-zA-Z]+.*/)) {
                    // remap packageName@version to packageName/version
                    snapshot[depType][packageName] = `/${version.replace(/([a-zA-Z].+)@/, '$1/')}`;
                }
            }
        }
    });
}
function findOriginalKeys(packages, { data: { packageName, version } }, lockfileVersion, { returnFullKey } = {}) {
    const matchedKeys = [];
    for (const key of Object.keys(packages)) {
        const snapshot = packages[key];
        // tarball package
        if (key.startsWith(`${packageName}@${version}`) &&
            snapshot.resolution?.['tarball']) {
            matchedKeys.push([getVersion(key, packageName), snapshot]);
        }
        // standard package
        if (lockfileVersion < 6 && key.startsWith(`${packageName}/${version}`)) {
            matchedKeys.push([
                returnFullKey ? key : getVersion(key, packageName),
                snapshot,
            ]);
        }
        if (lockfileVersion >= 6 &&
            lockfileVersion < 9 &&
            key.startsWith(`${packageName}@${version}`)) {
            matchedKeys.push([
                // we need to replace the @ with / for v5-7 syntax because the dpParse function expects old format
                returnFullKey
                    ? key.replace(`${packageName}@${version}`, `${packageName}/${version}`)
                    : getVersion(key, packageName),
                snapshot,
            ]);
        }
        if (lockfileVersion >= 9 && key.startsWith(`${packageName}@${version}`)) {
            matchedKeys.push([
                returnFullKey ? key : getVersion(key, packageName),
                snapshot,
            ]);
        }
        // alias package
        if (versionIsAlias(key, version, lockfileVersion)) {
            if (lockfileVersion >= 9) {
                // no postprocessing needed for v9
                matchedKeys.push([key, snapshot]);
            }
            else {
                // for root specifiers we need to ensure alias is prefixed with /
                const prefixedKey = returnFullKey ? key : `/${key}`;
                const mappedKey = prefixedKey.replace(/(\/?..+)@/, '$1/');
                matchedKeys.push([mappedKey, snapshot]);
            }
        }
    }
    return matchedKeys;
}
// check if version has a form of npm:packageName@version and
// key starts with /packageName/version
function versionIsAlias(key, versionExpr, lockfileVersion) {
    const PREFIX = 'npm:';
    if (!versionExpr.startsWith(PREFIX))
        return false;
    const indexOfVersionSeparator = versionExpr.indexOf('@', PREFIX.length + 1);
    const packageName = versionExpr.slice(PREFIX.length, indexOfVersionSeparator);
    const version = versionExpr.slice(indexOfVersionSeparator + 1);
    return lockfileVersion < 6
        ? key.startsWith(`${packageName}/${version}`)
        : key.startsWith(`${packageName}@${version}`);
}
function mapRootSnapshot(packageJson, packages, nodes, lockfileVersion) {
    const snapshot = { specifiers: {} };
    [
        'dependencies',
        'optionalDependencies',
        'devDependencies',
        'peerDependencies',
    ].forEach((depType) => {
        if (packageJson[depType]) {
            Object.keys(packageJson[depType]).forEach((packageName) => {
                const version = packageJson[depType][packageName];
                const node = nodes[`npm:${packageName}@${version}`] || nodes[`npm:${packageName}`];
                snapshot.specifiers[packageName] = version;
                // peer dependencies are mapped to dependencies
                let section = depType === 'peerDependencies' ? 'dependencies' : depType;
                snapshot[section] = snapshot[section] || {};
                snapshot[section][packageName] = findOriginalKeys(packages, node, lockfileVersion)[0][0];
            });
        }
    });
    Object.keys(snapshot).forEach((key) => {
        snapshot[key] = (0, object_sort_1.sortObjectByKeys)(snapshot[key]);
    });
    return snapshot;
}
function findVersion(key, packageName, isV5, alias) {
    if (isV5 && key.startsWith(`${packageName}/`)) {
        return getVersion(key, packageName);
    }
    // this matches v6 syntax and tarball packages
    if (key.startsWith(`${packageName}@`)) {
        return getVersion(key, packageName);
    }
    if (alias) {
        const aliasName = isV5
            ? key.slice(0, key.lastIndexOf('/'))
            : key.slice(0, key.indexOf('@', 2)); // we use 2 to ensure we don't catch the first @
        const version = getVersion(key, aliasName);
        return `npm:${aliasName}@${version}`;
    }
    // for tarball package the entire key is the version spec
    return key;
}
function getVersion(key, packageName) {
    return key.slice(packageName.length + 1);
}
function extractNameFromKey(key, isV5) {
    // if package name contains org e.g. "@babel/runtime@7.12.5"
    if (key.startsWith('@')) {
        if (isV5) {
            const startFrom = key.indexOf('/');
            return key.slice(0, key.indexOf('/', startFrom + 1));
        }
        else {
            // find the position of the '@'
            return key.slice(0, key.indexOf('@', 1));
        }
    }
    if (isV5) {
        // if package has just a name e.g. "react/7.12.5..."
        return key.slice(0, key.indexOf('/', 1));
    }
    else {
        // if package has just a name e.g. "react@7.12.5..."
        return key.slice(0, key.indexOf('@', 1));
    }
}
