"use strict";

Object.defineProperty(exports, "t", {
    value: true
});

exports.TreeNodeEnableIndex = exports.TreeNode = void 0;

class TreeNode {
    constructor(t, e, s = 1) {
        this.T = undefined;
        this.K = undefined;
        this.it = undefined;
        this.u = t;
        this.l = e;
        this.et = s;
    }
    L() {
        let t = this;
        const e = t.it.it === t;
        if (e && t.et === 1) {
            t = t.K;
        } else if (t.T) {
            t = t.T;
            while (t.K) {
                t = t.K;
            }
        } else {
            if (e) {
                return t.it;
            }
            let s = t.it;
            while (s.T === t) {
                t = s;
                s = t.it;
            }
            t = s;
        }
        return t;
    }
    B() {
        let t = this;
        if (t.K) {
            t = t.K;
            while (t.T) {
                t = t.T;
            }
            return t;
        } else {
            let e = t.it;
            while (e.K === t) {
                t = e;
                e = t.it;
            }
            if (t.K !== e) {
                return e;
            } else return t;
        }
    }
    ht() {
        const t = this.it;
        const e = this.K;
        const s = e.T;
        if (t.it === this) t.it = e; else if (t.T === this) t.T = e; else t.K = e;
        e.it = t;
        e.T = this;
        this.it = e;
        this.K = s;
        if (s) s.it = this;
        return e;
    }
    nt() {
        const t = this.it;
        const e = this.T;
        const s = e.K;
        if (t.it === this) t.it = e; else if (t.T === this) t.T = e; else t.K = e;
        e.it = t;
        e.K = this;
        this.it = e;
        this.T = s;
        if (s) s.it = this;
        return e;
    }
}

exports.TreeNode = TreeNode;

class TreeNodeEnableIndex extends TreeNode {
    constructor() {
        super(...arguments);
        this.st = 1;
    }
    ht() {
        const t = super.ht();
        this.ot();
        t.ot();
        return t;
    }
    nt() {
        const t = super.nt();
        this.ot();
        t.ot();
        return t;
    }
    ot() {
        this.st = 1;
        if (this.T) {
            this.st += this.T.st;
        }
        if (this.K) {
            this.st += this.K.st;
        }
    }
}

exports.TreeNodeEnableIndex = TreeNodeEnableIndex;
//# sourceMappingURL=TreeNode.js.map
