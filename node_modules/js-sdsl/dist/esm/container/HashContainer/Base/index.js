var __extends = this && this.t || function() {
    var extendStatics = function(t, i) {
        extendStatics = Object.setPrototypeOf || {
            __proto__: []
        } instanceof Array && function(t, i) {
            t.__proto__ = i;
        } || function(t, i) {
            for (var r in i) if (Object.prototype.hasOwnProperty.call(i, r)) t[r] = i[r];
        };
        return extendStatics(t, i);
    };
    return function(t, i) {
        if (typeof i !== "function" && i !== null) throw new TypeError("Class extends value " + String(i) + " is not a constructor or null");
        extendStatics(t, i);
        function __() {
            this.constructor = t;
        }
        t.prototype = i === null ? Object.create(i) : (__.prototype = i.prototype, new __);
    };
}();

import { Container, ContainerIterator } from "../../ContainerBase";

import checkObject from "../../../utils/checkObject";

import { throwIteratorAccessError } from "../../../utils/throwError";

var HashContainerIterator = function(t) {
    __extends(HashContainerIterator, t);
    function HashContainerIterator(i, r, n) {
        var e = t.call(this, n) || this;
        e.o = i;
        e.u = r;
        if (e.iteratorType === 0) {
            e.pre = function() {
                if (this.o.L === this.u) {
                    throwIteratorAccessError();
                }
                this.o = this.o.L;
                return this;
            };
            e.next = function() {
                if (this.o === this.u) {
                    throwIteratorAccessError();
                }
                this.o = this.o.m;
                return this;
            };
        } else {
            e.pre = function() {
                if (this.o.m === this.u) {
                    throwIteratorAccessError();
                }
                this.o = this.o.m;
                return this;
            };
            e.next = function() {
                if (this.o === this.u) {
                    throwIteratorAccessError();
                }
                this.o = this.o.L;
                return this;
            };
        }
        return e;
    }
    HashContainerIterator.prototype.isAccessible = function() {
        return this.o !== this.u;
    };
    return HashContainerIterator;
}(ContainerIterator);

export { HashContainerIterator };

var HashContainer = function(t) {
    __extends(HashContainer, t);
    function HashContainer() {
        var i = t.call(this) || this;
        i._ = [];
        i.I = {};
        i.HASH_TAG = Symbol("@@HASH_TAG");
        Object.setPrototypeOf(i.I, null);
        i.u = {};
        i.u.L = i.u.m = i.l = i.M = i.u;
        return i;
    }
    HashContainer.prototype.U = function(t) {
        var i = t.L, r = t.m;
        i.m = r;
        r.L = i;
        if (t === this.l) {
            this.l = r;
        }
        if (t === this.M) {
            this.M = i;
        }
        this.i -= 1;
    };
    HashContainer.prototype.v = function(t, i, r) {
        if (r === undefined) r = checkObject(t);
        var n;
        if (r) {
            var e = t[this.HASH_TAG];
            if (e !== undefined) {
                this._[e].H = i;
                return this.i;
            }
            Object.defineProperty(t, this.HASH_TAG, {
                value: this._.length,
                configurable: true
            });
            n = {
                p: t,
                H: i,
                L: this.M,
                m: this.u
            };
            this._.push(n);
        } else {
            var s = this.I[t];
            if (s) {
                s.H = i;
                return this.i;
            }
            this.I[t] = n = {
                p: t,
                H: i,
                L: this.M,
                m: this.u
            };
        }
        if (this.i === 0) {
            this.l = n;
            this.u.m = n;
        } else {
            this.M.m = n;
        }
        this.M = n;
        this.u.L = n;
        return ++this.i;
    };
    HashContainer.prototype.g = function(t, i) {
        if (i === undefined) i = checkObject(t);
        if (i) {
            var r = t[this.HASH_TAG];
            if (r === undefined) return this.u;
            return this._[r];
        } else {
            return this.I[t] || this.u;
        }
    };
    HashContainer.prototype.clear = function() {
        var t = this.HASH_TAG;
        this._.forEach((function(i) {
            delete i.p[t];
        }));
        this._ = [];
        this.I = {};
        Object.setPrototypeOf(this.I, null);
        this.i = 0;
        this.l = this.M = this.u.L = this.u.m = this.u;
    };
    HashContainer.prototype.eraseElementByKey = function(t, i) {
        var r;
        if (i === undefined) i = checkObject(t);
        if (i) {
            var n = t[this.HASH_TAG];
            if (n === undefined) return false;
            delete t[this.HASH_TAG];
            r = this._[n];
            delete this._[n];
        } else {
            r = this.I[t];
            if (r === undefined) return false;
            delete this.I[t];
        }
        this.U(r);
        return true;
    };
    HashContainer.prototype.eraseElementByIterator = function(t) {
        var i = t.o;
        if (i === this.u) {
            throwIteratorAccessError();
        }
        this.U(i);
        return t.next();
    };
    HashContainer.prototype.eraseElementByPos = function(t) {
        if (t < 0 || t > this.i - 1) {
            throw new RangeError;
        }
        var i = this.l;
        while (t--) {
            i = i.m;
        }
        this.U(i);
        return this.i;
    };
    return HashContainer;
}(Container);

export { HashContainer };
//# sourceMappingURL=index.js.map
