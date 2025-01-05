"use strict";

Object.defineProperty(exports, "t", {
    value: true
});

exports.default = void 0;

var _TreeNode = require("./TreeNode");

var _ContainerBase = require("../../ContainerBase");

var _throwError = require("../../../utils/throwError");

class TreeContainer extends _ContainerBase.Container {
    constructor(e = function(e, t) {
        if (e < t) return -1;
        if (e > t) return 1;
        return 0;
    }, t = false) {
        super();
        this.X = undefined;
        this.v = e;
        this.enableIndex = t;
        this.ee = t ? _TreeNode.TreeNodeEnableIndex : _TreeNode.TreeNode;
        this.h = new this.ee;
    }
    U(e, t) {
        let i = this.h;
        while (e) {
            const s = this.v(e.u, t);
            if (s < 0) {
                e = e.K;
            } else if (s > 0) {
                i = e;
                e = e.T;
            } else return e;
        }
        return i;
    }
    Y(e, t) {
        let i = this.h;
        while (e) {
            const s = this.v(e.u, t);
            if (s <= 0) {
                e = e.K;
            } else {
                i = e;
                e = e.T;
            }
        }
        return i;
    }
    Z(e, t) {
        let i = this.h;
        while (e) {
            const s = this.v(e.u, t);
            if (s < 0) {
                i = e;
                e = e.K;
            } else if (s > 0) {
                e = e.T;
            } else return e;
        }
        return i;
    }
    $(e, t) {
        let i = this.h;
        while (e) {
            const s = this.v(e.u, t);
            if (s < 0) {
                i = e;
                e = e.K;
            } else {
                e = e.T;
            }
        }
        return i;
    }
    te(e) {
        while (true) {
            const t = e.it;
            if (t === this.h) return;
            if (e.et === 1) {
                e.et = 0;
                return;
            }
            if (e === t.T) {
                const i = t.K;
                if (i.et === 1) {
                    i.et = 0;
                    t.et = 1;
                    if (t === this.X) {
                        this.X = t.ht();
                    } else t.ht();
                } else {
                    if (i.K && i.K.et === 1) {
                        i.et = t.et;
                        t.et = 0;
                        i.K.et = 0;
                        if (t === this.X) {
                            this.X = t.ht();
                        } else t.ht();
                        return;
                    } else if (i.T && i.T.et === 1) {
                        i.et = 1;
                        i.T.et = 0;
                        i.nt();
                    } else {
                        i.et = 1;
                        e = t;
                    }
                }
            } else {
                const i = t.T;
                if (i.et === 1) {
                    i.et = 0;
                    t.et = 1;
                    if (t === this.X) {
                        this.X = t.nt();
                    } else t.nt();
                } else {
                    if (i.T && i.T.et === 1) {
                        i.et = t.et;
                        t.et = 0;
                        i.T.et = 0;
                        if (t === this.X) {
                            this.X = t.nt();
                        } else t.nt();
                        return;
                    } else if (i.K && i.K.et === 1) {
                        i.et = 1;
                        i.K.et = 0;
                        i.ht();
                    } else {
                        i.et = 1;
                        e = t;
                    }
                }
            }
        }
    }
    V(e) {
        if (this.i === 1) {
            this.clear();
            return;
        }
        let t = e;
        while (t.T || t.K) {
            if (t.K) {
                t = t.K;
                while (t.T) t = t.T;
            } else {
                t = t.T;
            }
            const i = e.u;
            e.u = t.u;
            t.u = i;
            const s = e.l;
            e.l = t.l;
            t.l = s;
            e = t;
        }
        if (this.h.T === t) {
            this.h.T = t.it;
        } else if (this.h.K === t) {
            this.h.K = t.it;
        }
        this.te(t);
        let i = t.it;
        if (t === i.T) {
            i.T = undefined;
        } else i.K = undefined;
        this.i -= 1;
        this.X.et = 0;
        if (this.enableIndex) {
            while (i !== this.h) {
                i.st -= 1;
                i = i.it;
            }
        }
    }
    tt(e) {
        const t = typeof e === "number" ? e : undefined;
        const i = typeof e === "function" ? e : undefined;
        const s = typeof e === "undefined" ? [] : undefined;
        let r = 0;
        let n = this.X;
        const h = [];
        while (h.length || n) {
            if (n) {
                h.push(n);
                n = n.T;
            } else {
                n = h.pop();
                if (r === t) return n;
                s && s.push(n);
                i && i(n, r, this);
                r += 1;
                n = n.K;
            }
        }
        return s;
    }
    ie(e) {
        while (true) {
            const t = e.it;
            if (t.et === 0) return;
            const i = t.it;
            if (t === i.T) {
                const s = i.K;
                if (s && s.et === 1) {
                    s.et = t.et = 0;
                    if (i === this.X) return;
                    i.et = 1;
                    e = i;
                    continue;
                } else if (e === t.K) {
                    e.et = 0;
                    if (e.T) {
                        e.T.it = t;
                    }
                    if (e.K) {
                        e.K.it = i;
                    }
                    t.K = e.T;
                    i.T = e.K;
                    e.T = t;
                    e.K = i;
                    if (i === this.X) {
                        this.X = e;
                        this.h.it = e;
                    } else {
                        const t = i.it;
                        if (t.T === i) {
                            t.T = e;
                        } else t.K = e;
                    }
                    e.it = i.it;
                    t.it = e;
                    i.it = e;
                    i.et = 1;
                } else {
                    t.et = 0;
                    if (i === this.X) {
                        this.X = i.nt();
                    } else i.nt();
                    i.et = 1;
                    return;
                }
            } else {
                const s = i.T;
                if (s && s.et === 1) {
                    s.et = t.et = 0;
                    if (i === this.X) return;
                    i.et = 1;
                    e = i;
                    continue;
                } else if (e === t.T) {
                    e.et = 0;
                    if (e.T) {
                        e.T.it = i;
                    }
                    if (e.K) {
                        e.K.it = t;
                    }
                    i.K = e.T;
                    t.T = e.K;
                    e.T = i;
                    e.K = t;
                    if (i === this.X) {
                        this.X = e;
                        this.h.it = e;
                    } else {
                        const t = i.it;
                        if (t.T === i) {
                            t.T = e;
                        } else t.K = e;
                    }
                    e.it = i.it;
                    t.it = e;
                    i.it = e;
                    i.et = 1;
                } else {
                    t.et = 0;
                    if (i === this.X) {
                        this.X = i.ht();
                    } else i.ht();
                    i.et = 1;
                    return;
                }
            }
            if (this.enableIndex) {
                t.ot();
                i.ot();
                e.ot();
            }
            return;
        }
    }
    M(e, t, i) {
        if (this.X === undefined) {
            this.i += 1;
            this.X = new this.ee(e, t, 0);
            this.X.it = this.h;
            this.h.it = this.h.T = this.h.K = this.X;
            return this.i;
        }
        let s;
        const r = this.h.T;
        const n = this.v(r.u, e);
        if (n === 0) {
            r.l = t;
            return this.i;
        } else if (n > 0) {
            r.T = new this.ee(e, t);
            r.T.it = r;
            s = r.T;
            this.h.T = s;
        } else {
            const r = this.h.K;
            const n = this.v(r.u, e);
            if (n === 0) {
                r.l = t;
                return this.i;
            } else if (n < 0) {
                r.K = new this.ee(e, t);
                r.K.it = r;
                s = r.K;
                this.h.K = s;
            } else {
                if (i !== undefined) {
                    const r = i.o;
                    if (r !== this.h) {
                        const i = this.v(r.u, e);
                        if (i === 0) {
                            r.l = t;
                            return this.i;
                        } else if (i > 0) {
                            const i = r.L();
                            const n = this.v(i.u, e);
                            if (n === 0) {
                                i.l = t;
                                return this.i;
                            } else if (n < 0) {
                                s = new this.ee(e, t);
                                if (i.K === undefined) {
                                    i.K = s;
                                    s.it = i;
                                } else {
                                    r.T = s;
                                    s.it = r;
                                }
                            }
                        }
                    }
                }
                if (s === undefined) {
                    s = this.X;
                    while (true) {
                        const i = this.v(s.u, e);
                        if (i > 0) {
                            if (s.T === undefined) {
                                s.T = new this.ee(e, t);
                                s.T.it = s;
                                s = s.T;
                                break;
                            }
                            s = s.T;
                        } else if (i < 0) {
                            if (s.K === undefined) {
                                s.K = new this.ee(e, t);
                                s.K.it = s;
                                s = s.K;
                                break;
                            }
                            s = s.K;
                        } else {
                            s.l = t;
                            return this.i;
                        }
                    }
                }
            }
        }
        if (this.enableIndex) {
            let e = s.it;
            while (e !== this.h) {
                e.st += 1;
                e = e.it;
            }
        }
        this.ie(s);
        this.i += 1;
        return this.i;
    }
    rt(e, t) {
        while (e) {
            const i = this.v(e.u, t);
            if (i < 0) {
                e = e.K;
            } else if (i > 0) {
                e = e.T;
            } else return e;
        }
        return e || this.h;
    }
    clear() {
        this.i = 0;
        this.X = undefined;
        this.h.it = undefined;
        this.h.T = this.h.K = undefined;
    }
    updateKeyByIterator(e, t) {
        const i = e.o;
        if (i === this.h) {
            (0, _throwError.throwIteratorAccessError)();
        }
        if (this.i === 1) {
            i.u = t;
            return true;
        }
        const s = i.B().u;
        if (i === this.h.T) {
            if (this.v(s, t) > 0) {
                i.u = t;
                return true;
            }
            return false;
        }
        const r = i.L().u;
        if (i === this.h.K) {
            if (this.v(r, t) < 0) {
                i.u = t;
                return true;
            }
            return false;
        }
        if (this.v(r, t) >= 0 || this.v(s, t) <= 0) return false;
        i.u = t;
        return true;
    }
    eraseElementByPos(e) {
        if (e < 0 || e > this.i - 1) {
            throw new RangeError;
        }
        const t = this.tt(e);
        this.V(t);
        return this.i;
    }
    eraseElementByKey(e) {
        if (this.i === 0) return false;
        const t = this.rt(this.X, e);
        if (t === this.h) return false;
        this.V(t);
        return true;
    }
    eraseElementByIterator(e) {
        const t = e.o;
        if (t === this.h) {
            (0, _throwError.throwIteratorAccessError)();
        }
        const i = t.K === undefined;
        const s = e.iteratorType === 0;
        if (s) {
            if (i) e.next();
        } else {
            if (!i || t.T === undefined) e.next();
        }
        this.V(t);
        return e;
    }
    getHeight() {
        if (this.i === 0) return 0;
        function traversal(e) {
            if (!e) return 0;
            return Math.max(traversal(e.T), traversal(e.K)) + 1;
        }
        return traversal(this.X);
    }
}

var _default = TreeContainer;

exports.default = _default;
//# sourceMappingURL=index.js.map
