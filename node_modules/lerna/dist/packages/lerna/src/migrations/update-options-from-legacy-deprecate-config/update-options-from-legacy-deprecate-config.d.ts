/**
 * Prior to v7, lerna has some runtime config coercion logic called deprecate-config.ts
 * but that can lead to confusing behavior, so we removed it.
 *
 * Given we can implement the following lerna repair generator, we still offer users an
 * easy way to deal with their outdated config.
 */
import { Tree } from "@nx/devkit";
export default function generator(tree: Tree): Promise<void>;
