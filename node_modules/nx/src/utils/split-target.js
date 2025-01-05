"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.splitTarget = splitTarget;
exports.splitByColons = splitByColons;
function splitTarget(s, projectGraph) {
    let [project, ...segments] = splitByColons(s);
    const validTargets = projectGraph.nodes[project]
        ? projectGraph.nodes[project].data.targets
        : {};
    const validTargetNames = new Set(Object.keys(validTargets ?? {}));
    return [project, ...groupJointSegments(segments, validTargetNames)];
}
function groupJointSegments(segments, validTargetNames) {
    for (let endingSegmentIdx = segments.length; endingSegmentIdx > 0; endingSegmentIdx--) {
        const potentialTargetName = segments.slice(0, endingSegmentIdx).join(':');
        if (validTargetNames.has(potentialTargetName)) {
            const configurationName = endingSegmentIdx < segments.length
                ? segments.slice(endingSegmentIdx).join(':')
                : null;
            return configurationName
                ? [potentialTargetName, configurationName]
                : [potentialTargetName];
        }
    }
    // If we can't find a segment match, keep older behaviour
    return segments;
}
function splitByColons(s) {
    const parts = [];
    let currentPart = '';
    for (let i = 0; i < s.length; ++i) {
        if (s[i] === ':') {
            parts.push(currentPart);
            currentPart = '';
        }
        else if (s[i] === '"') {
            i++;
            for (; i < s.length && s[i] != '"'; ++i) {
                currentPart += s[i];
            }
        }
        else {
            currentPart += s[i];
        }
    }
    parts.push(currentPart);
    return parts;
}
