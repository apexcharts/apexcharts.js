(function(e,o){typeof exports=="object"&&typeof module<"u"?o(require("@svgdotjs/svg.js")):typeof define=="function"&&define.amd?define(["@svgdotjs/svg.js"],o):(e=typeof globalThis<"u"?globalThis:e||self,o(e.SVG))})(this,function(e){"use strict";/*!
* @svgdotjs/svg.draggable.js - An extension for svg.js which allows to drag elements with your mouse
* @version 3.0.4
* https://github.com/svgdotjs/svg.draggable.js
*
* @copyright Wout Fierens
* @license MIT
*
* BUILT: Thu Jun 27 2024 12:04:05 GMT+0200 (Central European Summer Time)
*/const o=s=>(s.changedTouches&&(s=s.changedTouches[0]),{x:s.clientX,y:s.clientY});class f{constructor(t){t.remember("_draggable",this),this.el=t,this.drag=this.drag.bind(this),this.startDrag=this.startDrag.bind(this),this.endDrag=this.endDrag.bind(this)}init(t){t?(this.el.on("mousedown.drag",this.startDrag),this.el.on("touchstart.drag",this.startDrag,{passive:!1})):(this.el.off("mousedown.drag"),this.el.off("touchstart.drag"))}startDrag(t){const i=!t.type.indexOf("mouse");if(i&&t.which!==1&&t.buttons!==0||this.el.dispatch("beforedrag",{event:t,handler:this}).defaultPrevented)return;t.preventDefault(),t.stopPropagation(),this.init(!1),this.box=this.el.bbox(),this.lastClick=this.el.point(o(t));const r=(i?"mousemove":"touchmove")+".drag",n=(i?"mouseup":"touchend")+".drag";e.on(window,r,this.drag,this,{passive:!1}),e.on(window,n,this.endDrag,this,{passive:!1}),this.el.fire("dragstart",{event:t,handler:this,box:this.box})}drag(t){const{box:i,lastClick:r}=this,n=this.el.point(o(t)),d=n.x-r.x,a=n.y-r.y;if(!d&&!a)return i;const h=i.x+d,l=i.y+a;this.box=new e.Box(h,l,i.w,i.h),this.lastClick=n,!this.el.dispatch("dragmove",{event:t,handler:this,box:this.box}).defaultPrevented&&this.move(h,l)}move(t,i){this.el.type==="svg"?e.G.prototype.move.call(this.el,t,i):this.el.move(t,i)}endDrag(t){this.drag(t),this.el.fire("dragend",{event:t,handler:this,box:this.box}),e.off(window,"mousemove.drag"),e.off(window,"touchmove.drag"),e.off(window,"mouseup.drag"),e.off(window,"touchend.drag"),this.init(!0)}}e.extend(e.Element,{draggable(s=!0){return(this.remember("_draggable")||new f(this)).init(s),this}})});
//# sourceMappingURL=svg.draggable.js.map
