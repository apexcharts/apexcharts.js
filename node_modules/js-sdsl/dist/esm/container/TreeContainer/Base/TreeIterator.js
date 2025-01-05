var __extends = this && this.t || function() {
    var extendStatics = function(t, r) {
        extendStatics = Object.setPrototypeOf || {
            __proto__: []
        } instanceof Array && function(t, r) {
            t.__proto__ = r;
        } || function(t, r) {
            for (var e in r) if (Object.prototype.hasOwnProperty.call(r, e)) t[e] = r[e];
        };
        return extendStatics(t, r);
    };
    return function(t, r) {
        if (typeof r !== "function" && r !== null) throw new TypeError("Class extends value " + String(r) + " is not a constructor or null");
        extendStatics(t, r);
        function __() {
            this.constructor = t;
        }
        t.prototype = r === null ? Object.create(r) : (__.prototype = r.prototype, new __);
    };
}();

import { ContainerIterator } from "../../ContainerBase";

import { throwIteratorAccessError } from "../../../utils/throwError";

var TreeIterator = function(t) {
    __extends(TreeIterator, t);
    function TreeIterator(r, e, i) {
        var n = t.call(this, i) || this;
        n.o = r;
        n.u = e;
        if (n.iteratorType === 0) {
            n.pre = function() {
                if (this.o === this.u.Y) {
                    throwIteratorAccessError();
                }
                this.o = this.o.L();
                return this;
            };
            n.next = function() {
                if (this.o === this.u) {
                    throwIteratorAccessError();
                }
                this.o = this.o.m();
                return this;
            };
        } else {
            n.pre = function() {
                if (this.o === this.u.Z) {
                    throwIteratorAccessError();
                }
                this.o = this.o.m();
                return this;
            };
            n.next = function() {
                if (this.o === this.u) {
                    throwIteratorAccessError();
                }
                this.o = this.o.L();
                return this;
            };
        }
        return n;
    }
    Object.defineProperty(TreeIterator.prototype, "index", {
        get: function() {
            var t = this.o;
            var r = this.u.tt;
            if (t === this.u) {
                if (r) {
                    return r.rt - 1;
                }
                return 0;
            }
            var e = 0;
            if (t.Y) {
                e += t.Y.rt;
            }
            while (t !== r) {
                var i = t.tt;
                if (t === i.Z) {
                    e += 1;
                    if (i.Y) {
                        e += i.Y.rt;
                    }
                }
                t = i;
            }
            return e;
        },
        enumerable: false,
        configurable: true
    });
    TreeIterator.prototype.isAccessible = function() {
        return this.o !== this.u;
    };
    return TreeIterator;
}(ContainerIterator);

export default TreeIterator;
//# sourceMappingURL=TreeIterator.js.map
