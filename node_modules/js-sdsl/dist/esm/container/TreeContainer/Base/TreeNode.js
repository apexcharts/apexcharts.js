var __extends = this && this.t || function() {
    var extendStatics = function(e, t) {
        extendStatics = Object.setPrototypeOf || {
            __proto__: []
        } instanceof Array && function(e, t) {
            e.__proto__ = t;
        } || function(e, t) {
            for (var n in t) if (Object.prototype.hasOwnProperty.call(t, n)) e[n] = t[n];
        };
        return extendStatics(e, t);
    };
    return function(e, t) {
        if (typeof t !== "function" && t !== null) throw new TypeError("Class extends value " + String(t) + " is not a constructor or null");
        extendStatics(e, t);
        function __() {
            this.constructor = e;
        }
        e.prototype = t === null ? Object.create(t) : (__.prototype = t.prototype, new __);
    };
}();

var TreeNode = function() {
    function TreeNode(e, t, n) {
        if (n === void 0) {
            n = 1;
        }
        this.Y = undefined;
        this.Z = undefined;
        this.tt = undefined;
        this.p = e;
        this.H = t;
        this.ee = n;
    }
    TreeNode.prototype.L = function() {
        var e = this;
        var t = e.tt.tt === e;
        if (t && e.ee === 1) {
            e = e.Z;
        } else if (e.Y) {
            e = e.Y;
            while (e.Z) {
                e = e.Z;
            }
        } else {
            if (t) {
                return e.tt;
            }
            var n = e.tt;
            while (n.Y === e) {
                e = n;
                n = e.tt;
            }
            e = n;
        }
        return e;
    };
    TreeNode.prototype.m = function() {
        var e = this;
        if (e.Z) {
            e = e.Z;
            while (e.Y) {
                e = e.Y;
            }
            return e;
        } else {
            var t = e.tt;
            while (t.Z === e) {
                e = t;
                t = e.tt;
            }
            if (e.Z !== t) {
                return t;
            } else return e;
        }
    };
    TreeNode.prototype.te = function() {
        var e = this.tt;
        var t = this.Z;
        var n = t.Y;
        if (e.tt === this) e.tt = t; else if (e.Y === this) e.Y = t; else e.Z = t;
        t.tt = e;
        t.Y = this;
        this.tt = t;
        this.Z = n;
        if (n) n.tt = this;
        return t;
    };
    TreeNode.prototype.ne = function() {
        var e = this.tt;
        var t = this.Y;
        var n = t.Z;
        if (e.tt === this) e.tt = t; else if (e.Y === this) e.Y = t; else e.Z = t;
        t.tt = e;
        t.Z = this;
        this.tt = t;
        this.Y = n;
        if (n) n.tt = this;
        return t;
    };
    return TreeNode;
}();

export { TreeNode };

var TreeNodeEnableIndex = function(e) {
    __extends(TreeNodeEnableIndex, e);
    function TreeNodeEnableIndex() {
        var t = e !== null && e.apply(this, arguments) || this;
        t.rt = 1;
        return t;
    }
    TreeNodeEnableIndex.prototype.te = function() {
        var t = e.prototype.te.call(this);
        this.ie();
        t.ie();
        return t;
    };
    TreeNodeEnableIndex.prototype.ne = function() {
        var t = e.prototype.ne.call(this);
        this.ie();
        t.ie();
        return t;
    };
    TreeNodeEnableIndex.prototype.ie = function() {
        this.rt = 1;
        if (this.Y) {
            this.rt += this.Y.rt;
        }
        if (this.Z) {
            this.rt += this.Z.rt;
        }
    };
    return TreeNodeEnableIndex;
}(TreeNode);

export { TreeNodeEnableIndex };
//# sourceMappingURL=TreeNode.js.map
