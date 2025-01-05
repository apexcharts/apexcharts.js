import type TreeIterator from './TreeIterator';
import { TreeNode } from './TreeNode';
import { Container } from "../../ContainerBase";
declare abstract class TreeContainer<K, V> extends Container<K | [K, V]> {
    enableIndex: boolean;
    protected _inOrderTraversal(): TreeNode<K, V>[];
    protected _inOrderTraversal(pos: number): TreeNode<K, V>;
    protected _inOrderTraversal(callback: (node: TreeNode<K, V>, index: number, map: this) => void): TreeNode<K, V>;
    clear(): void;
    /**
     * @description Update node's key by iterator.
     * @param iter - The iterator you want to change.
     * @param key - The key you want to update.
     * @returns Whether the modification is successful.
     * @example
     * const st = new orderedSet([1, 2, 5]);
     * const iter = st.find(2);
     * st.updateKeyByIterator(iter, 3); // then st will become [1, 3, 5]
     */
    updateKeyByIterator(iter: TreeIterator<K, V>, key: K): boolean;
    eraseElementByPos(pos: number): number;
    /**
     * @description Remove the element of the specified key.
     * @param key - The key you want to remove.
     * @returns Whether erase successfully.
     */
    eraseElementByKey(key: K): boolean;
    eraseElementByIterator(iter: TreeIterator<K, V>): TreeIterator<K, V>;
    /**
     * @description Get the height of the tree.
     * @returns Number about the height of the RB-tree.
     */
    getHeight(): number;
    /**
     * @param key - The given key you want to compare.
     * @returns An iterator to the first element less than the given key.
     */
    abstract reverseUpperBound(key: K): TreeIterator<K, V>;
    /**
     * @description Union the other tree to self.
     * @param other - The other tree container you want to merge.
     * @returns The size of the tree after union.
     */
    abstract union(other: TreeContainer<K, V>): number;
    /**
     * @param key - The given key you want to compare.
     * @returns An iterator to the first element not greater than the given key.
     */
    abstract reverseLowerBound(key: K): TreeIterator<K, V>;
    /**
     * @param key - The given key you want to compare.
     * @returns An iterator to the first element not less than the given key.
     */
    abstract lowerBound(key: K): TreeIterator<K, V>;
    /**
     * @param key - The given key you want to compare.
     * @returns An iterator to the first element greater than the given key.
     */
    abstract upperBound(key: K): TreeIterator<K, V>;
}
export default TreeContainer;
