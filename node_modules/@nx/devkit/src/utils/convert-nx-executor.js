"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertNxExecutor = convertNxExecutor;
const package_json_1 = require("./package-json");
const semver_1 = require("semver");
const devkit_internals_1 = require("nx/src/devkit-internals");
/**
 * Convert an Nx Executor into an Angular Devkit Builder
 *
 * Use this to expose a compatible Angular Builder
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function convertNxExecutor(executor) {
    const builderFunction = (options, builderContext) => {
        const nxJsonConfiguration = (0, devkit_internals_1.readNxJsonFromDisk)(builderContext.workspaceRoot);
        const promise = async () => {
            const projectsConfigurations = {
                version: 2,
                projects: await (0, devkit_internals_1.retrieveProjectConfigurationsWithAngularProjects)(builderContext.workspaceRoot, nxJsonConfiguration).then((p) => {
                    if (p.projectNodes) {
                        return p.projectNodes;
                    }
                    // v18.3.4 changed projects to be keyed by root
                    // rather than project name
                    if ((0, semver_1.lt)(package_json_1.NX_VERSION, '18.3.4')) {
                        return p.projects;
                    }
                    if (devkit_internals_1.readProjectConfigurationsFromRootMap) {
                        return (0, devkit_internals_1.readProjectConfigurationsFromRootMap)(p.projects);
                    }
                    throw new Error('Unable to successfully map Nx executor -> Angular Builder');
                }),
            };
            const context = {
                root: builderContext.workspaceRoot,
                projectName: builderContext.target.project,
                targetName: builderContext.target.target,
                target: builderContext.target.target,
                configurationName: builderContext.target.configuration,
                projectsConfigurations,
                nxJsonConfiguration,
                cwd: process.cwd(),
                projectGraph: null,
                taskGraph: null,
                isVerbose: false,
            };
            return executor(options, context);
        };
        return toObservable(promise());
    };
    return require('@angular-devkit/architect').createBuilder(builderFunction);
}
function toObservable(promiseOrAsyncIterator) {
    return new (require('rxjs').Observable)((subscriber) => {
        promiseOrAsyncIterator
            .then((value) => {
            if (!value.next) {
                subscriber.next(value);
                subscriber.complete();
            }
            else {
                let asyncIterator = value;
                function recurse(iterator) {
                    iterator
                        .next()
                        .then((result) => {
                        if (!result.done) {
                            subscriber.next(result.value);
                            recurse(iterator);
                        }
                        else {
                            if (result.value) {
                                subscriber.next(result.value);
                            }
                            subscriber.complete();
                        }
                    })
                        .catch((e) => {
                        subscriber.error(e);
                    });
                }
                recurse(asyncIterator);
                return () => {
                    asyncIterator.return();
                };
            }
        })
            .catch((err) => {
            subscriber.error(err);
        });
    });
}
