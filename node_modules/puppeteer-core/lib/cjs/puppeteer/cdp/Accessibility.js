"use strict";
/**
 * @license
 * Copyright 2018 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Accessibility = void 0;
/**
 * The Accessibility class provides methods for inspecting the browser's
 * accessibility tree. The accessibility tree is used by assistive technology
 * such as {@link https://en.wikipedia.org/wiki/Screen_reader | screen readers} or
 * {@link https://en.wikipedia.org/wiki/Switch_access | switches}.
 *
 * @remarks
 *
 * Accessibility is a very platform-specific thing. On different platforms,
 * there are different screen readers that might have wildly different output.
 *
 * Blink - Chrome's rendering engine - has a concept of "accessibility tree",
 * which is then translated into different platform-specific APIs. Accessibility
 * namespace gives users access to the Blink Accessibility Tree.
 *
 * Most of the accessibility tree gets filtered out when converting from Blink
 * AX Tree to Platform-specific AX-Tree or by assistive technologies themselves.
 * By default, Puppeteer tries to approximate this filtering, exposing only
 * the "interesting" nodes of the tree.
 *
 * @public
 */
class Accessibility {
    #realm;
    /**
     * @internal
     */
    constructor(realm) {
        this.#realm = realm;
    }
    /**
     * Captures the current state of the accessibility tree.
     * The returned object represents the root accessible node of the page.
     *
     * @remarks
     *
     * **NOTE** The Chrome accessibility tree contains nodes that go unused on
     * most platforms and by most screen readers. Puppeteer will discard them as
     * well for an easier to process tree, unless `interestingOnly` is set to
     * `false`.
     *
     * @example
     * An example of dumping the entire accessibility tree:
     *
     * ```ts
     * const snapshot = await page.accessibility.snapshot();
     * console.log(snapshot);
     * ```
     *
     * @example
     * An example of logging the focused node's name:
     *
     * ```ts
     * const snapshot = await page.accessibility.snapshot();
     * const node = findFocusedNode(snapshot);
     * console.log(node && node.name);
     *
     * function findFocusedNode(node) {
     *   if (node.focused) return node;
     *   for (const child of node.children || []) {
     *     const foundNode = findFocusedNode(child);
     *     return foundNode;
     *   }
     *   return null;
     * }
     * ```
     *
     * @returns An AXNode object representing the snapshot.
     */
    async snapshot(options = {}) {
        const { interestingOnly = true, root = null } = options;
        const { nodes } = await this.#realm.environment.client.send('Accessibility.getFullAXTree');
        let backendNodeId;
        if (root) {
            const { node } = await this.#realm.environment.client.send('DOM.describeNode', {
                objectId: root.id,
            });
            backendNodeId = node.backendNodeId;
        }
        const defaultRoot = AXNode.createTree(this.#realm, nodes);
        let needle = defaultRoot;
        if (backendNodeId) {
            needle = defaultRoot.find(node => {
                return node.payload.backendDOMNodeId === backendNodeId;
            });
            if (!needle) {
                return null;
            }
        }
        if (!interestingOnly) {
            return this.serializeTree(needle)[0] ?? null;
        }
        const interestingNodes = new Set();
        this.collectInterestingNodes(interestingNodes, defaultRoot, false);
        if (!interestingNodes.has(needle)) {
            return null;
        }
        return this.serializeTree(needle, interestingNodes)[0] ?? null;
    }
    serializeTree(node, interestingNodes) {
        const children = [];
        for (const child of node.children) {
            children.push(...this.serializeTree(child, interestingNodes));
        }
        if (interestingNodes && !interestingNodes.has(node)) {
            return children;
        }
        const serializedNode = node.serialize();
        if (children.length) {
            serializedNode.children = children;
        }
        return [serializedNode];
    }
    collectInterestingNodes(collection, node, insideControl) {
        if (node.isInteresting(insideControl)) {
            collection.add(node);
        }
        if (node.isLeafNode()) {
            return;
        }
        insideControl = insideControl || node.isControl();
        for (const child of node.children) {
            this.collectInterestingNodes(collection, child, insideControl);
        }
    }
}
exports.Accessibility = Accessibility;
class AXNode {
    payload;
    children = [];
    #richlyEditable = false;
    #editable = false;
    #focusable = false;
    #hidden = false;
    #name;
    #role;
    #ignored;
    #cachedHasFocusableChild;
    #realm;
    constructor(realm, payload) {
        this.payload = payload;
        this.#name = this.payload.name ? this.payload.name.value : '';
        this.#role = this.payload.role ? this.payload.role.value : 'Unknown';
        this.#ignored = this.payload.ignored;
        this.#realm = realm;
        for (const property of this.payload.properties || []) {
            if (property.name === 'editable') {
                this.#richlyEditable = property.value.value === 'richtext';
                this.#editable = true;
            }
            if (property.name === 'focusable') {
                this.#focusable = property.value.value;
            }
            if (property.name === 'hidden') {
                this.#hidden = property.value.value;
            }
        }
    }
    #isPlainTextField() {
        if (this.#richlyEditable) {
            return false;
        }
        if (this.#editable) {
            return true;
        }
        return this.#role === 'textbox' || this.#role === 'searchbox';
    }
    #isTextOnlyObject() {
        const role = this.#role;
        return (role === 'LineBreak' ||
            role === 'text' ||
            role === 'InlineTextBox' ||
            role === 'StaticText');
    }
    #hasFocusableChild() {
        if (this.#cachedHasFocusableChild === undefined) {
            this.#cachedHasFocusableChild = false;
            for (const child of this.children) {
                if (child.#focusable || child.#hasFocusableChild()) {
                    this.#cachedHasFocusableChild = true;
                    break;
                }
            }
        }
        return this.#cachedHasFocusableChild;
    }
    find(predicate) {
        if (predicate(this)) {
            return this;
        }
        for (const child of this.children) {
            const result = child.find(predicate);
            if (result) {
                return result;
            }
        }
        return null;
    }
    isLeafNode() {
        if (!this.children.length) {
            return true;
        }
        // These types of objects may have children that we use as internal
        // implementation details, but we want to expose them as leaves to platform
        // accessibility APIs because screen readers might be confused if they find
        // any children.
        if (this.#isPlainTextField() || this.#isTextOnlyObject()) {
            return true;
        }
        // Roles whose children are only presentational according to the ARIA and
        // HTML5 Specs should be hidden from screen readers.
        // (Note that whilst ARIA buttons can have only presentational children, HTML5
        // buttons are allowed to have content.)
        switch (this.#role) {
            case 'doc-cover':
            case 'graphics-symbol':
            case 'img':
            case 'image':
            case 'Meter':
            case 'scrollbar':
            case 'slider':
            case 'separator':
            case 'progressbar':
                return true;
            default:
                break;
        }
        // Here and below: Android heuristics
        if (this.#hasFocusableChild()) {
            return false;
        }
        if (this.#focusable && this.#name) {
            return true;
        }
        if (this.#role === 'heading' && this.#name) {
            return true;
        }
        return false;
    }
    isControl() {
        switch (this.#role) {
            case 'button':
            case 'checkbox':
            case 'ColorWell':
            case 'combobox':
            case 'DisclosureTriangle':
            case 'listbox':
            case 'menu':
            case 'menubar':
            case 'menuitem':
            case 'menuitemcheckbox':
            case 'menuitemradio':
            case 'radio':
            case 'scrollbar':
            case 'searchbox':
            case 'slider':
            case 'spinbutton':
            case 'switch':
            case 'tab':
            case 'textbox':
            case 'tree':
            case 'treeitem':
                return true;
            default:
                return false;
        }
    }
    isInteresting(insideControl) {
        const role = this.#role;
        if (role === 'Ignored' || this.#hidden || this.#ignored) {
            return false;
        }
        if (this.#focusable || this.#richlyEditable) {
            return true;
        }
        // If it's not focusable but has a control role, then it's interesting.
        if (this.isControl()) {
            return true;
        }
        // A non focusable child of a control is not interesting
        if (insideControl) {
            return false;
        }
        return this.isLeafNode() && !!this.#name;
    }
    serialize() {
        const properties = new Map();
        for (const property of this.payload.properties || []) {
            properties.set(property.name.toLowerCase(), property.value.value);
        }
        if (this.payload.name) {
            properties.set('name', this.payload.name.value);
        }
        if (this.payload.value) {
            properties.set('value', this.payload.value.value);
        }
        if (this.payload.description) {
            properties.set('description', this.payload.description.value);
        }
        const node = {
            role: this.#role,
            elementHandle: async () => {
                if (!this.payload.backendDOMNodeId) {
                    return null;
                }
                return (await this.#realm.adoptBackendNode(this.payload.backendDOMNodeId));
            },
        };
        const userStringProperties = [
            'name',
            'value',
            'description',
            'keyshortcuts',
            'roledescription',
            'valuetext',
        ];
        const getUserStringPropertyValue = (key) => {
            return properties.get(key);
        };
        for (const userStringProperty of userStringProperties) {
            if (!properties.has(userStringProperty)) {
                continue;
            }
            node[userStringProperty] = getUserStringPropertyValue(userStringProperty);
        }
        const booleanProperties = [
            'disabled',
            'expanded',
            'focused',
            'modal',
            'multiline',
            'multiselectable',
            'readonly',
            'required',
            'selected',
        ];
        const getBooleanPropertyValue = (key) => {
            return properties.get(key);
        };
        for (const booleanProperty of booleanProperties) {
            // RootWebArea's treat focus differently than other nodes. They report whether
            // their frame  has focus, not whether focus is specifically on the root
            // node.
            if (booleanProperty === 'focused' && this.#role === 'RootWebArea') {
                continue;
            }
            const value = getBooleanPropertyValue(booleanProperty);
            if (!value) {
                continue;
            }
            node[booleanProperty] = getBooleanPropertyValue(booleanProperty);
        }
        const tristateProperties = ['checked', 'pressed'];
        for (const tristateProperty of tristateProperties) {
            if (!properties.has(tristateProperty)) {
                continue;
            }
            const value = properties.get(tristateProperty);
            node[tristateProperty] =
                value === 'mixed' ? 'mixed' : value === 'true' ? true : false;
        }
        const numericalProperties = [
            'level',
            'valuemax',
            'valuemin',
        ];
        const getNumericalPropertyValue = (key) => {
            return properties.get(key);
        };
        for (const numericalProperty of numericalProperties) {
            if (!properties.has(numericalProperty)) {
                continue;
            }
            node[numericalProperty] = getNumericalPropertyValue(numericalProperty);
        }
        const tokenProperties = [
            'autocomplete',
            'haspopup',
            'invalid',
            'orientation',
        ];
        const getTokenPropertyValue = (key) => {
            return properties.get(key);
        };
        for (const tokenProperty of tokenProperties) {
            const value = getTokenPropertyValue(tokenProperty);
            if (!value || value === 'false') {
                continue;
            }
            node[tokenProperty] = getTokenPropertyValue(tokenProperty);
        }
        return node;
    }
    static createTree(realm, payloads) {
        const nodeById = new Map();
        for (const payload of payloads) {
            nodeById.set(payload.nodeId, new AXNode(realm, payload));
        }
        for (const node of nodeById.values()) {
            for (const childId of node.payload.childIds || []) {
                const child = nodeById.get(childId);
                if (child) {
                    node.children.push(child);
                }
            }
        }
        return nodeById.values().next().value;
    }
}
//# sourceMappingURL=Accessibility.js.map