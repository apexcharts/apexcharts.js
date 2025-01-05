/*!
* @svgdotjs/svg.filter.js - A plugin for svg.js adding filter functionality
* @version 3.0.8
* https://github.com/svgdotjs/svg.filter.js
*
* @copyright Wout Fierens
* @license MIT
*
* BUILT: Mon Oct 18 2021 15:55:55 GMT+0200 (Mitteleuropäische Sommerzeit)
*/;
this.SVG = this.SVG || {};
this.SVG.Filter = (function (svg_js) {
  'use strict';

  class Filter extends svg_js.Element {
    constructor(node) {
      super(svg_js.nodeOrNew('filter', node), node);
      this.$source = 'SourceGraphic';
      this.$sourceAlpha = 'SourceAlpha';
      this.$background = 'BackgroundImage';
      this.$backgroundAlpha = 'BackgroundAlpha';
      this.$fill = 'FillPaint';
      this.$stroke = 'StrokePaint';
      this.$autoSetIn = true;
    }

    put(element, i) {
      element = super.put(element, i);

      if (!element.attr('in') && this.$autoSetIn) {
        element.attr('in', this.$source);
      }

      if (!element.attr('result')) {
        element.attr('result', element.id());
      }

      return element;
    } // Unmask all masked elements and remove itself


    remove() {
      // unmask all targets
      this.targets().each('unfilter'); // remove mask from parent

      return super.remove();
    }

    targets() {
      return svg_js.find('svg [filter*="' + this.id() + '"]');
    }

    toString() {
      return 'url(#' + this.id() + ')';
    }

  } // Create Effect class

  class Effect extends svg_js.Element {
    constructor(node, attr) {
      super(node, attr);
      this.result(this.id());
    }

    in(effect) {
      // Act as getter
      if (effect == null) {
        const _in = this.attr('in');

        const ref = this.parent() && this.parent().find(`[result="${_in}"]`)[0];
        return ref || _in;
      } // Avr as setter


      return this.attr('in', effect);
    } // Named result


    result(result) {
      return this.attr('result', result);
    } // Stringification


    toString() {
      return this.result();
    }

  } // This function takes an array with attr keys and sets for every key the
  // attribute to the value of one paramater
  // getAttrSetter(['a', 'b']) becomes this.attr({a: param1, b: param2})


  const getAttrSetter = params => {
    return function (...args) {
      for (let i = params.length; i--;) {
        if (args[i] != null) {
          this.attr(params[i], args[i]);
        }
      }
    };
  };

  const updateFunctions = {
    blend: getAttrSetter(['in', 'in2', 'mode']),
    // ColorMatrix effect
    colorMatrix: getAttrSetter(['type', 'values']),
    // Composite effect
    composite: getAttrSetter(['in', 'in2', 'operator']),
    // ConvolveMatrix effect
    convolveMatrix: function (matrix) {
      matrix = new svg_js.Array(matrix).toString();
      this.attr({
        order: Math.sqrt(matrix.split(' ').length),
        kernelMatrix: matrix
      });
    },
    // DiffuseLighting effect
    diffuseLighting: getAttrSetter(['surfaceScale', 'lightingColor', 'diffuseConstant', 'kernelUnitLength']),
    // DisplacementMap effect
    displacementMap: getAttrSetter(['in', 'in2', 'scale', 'xChannelSelector', 'yChannelSelector']),
    // DropShadow effect
    dropShadow: getAttrSetter(['in', 'dx', 'dy', 'stdDeviation']),
    // Flood effect
    flood: getAttrSetter(['flood-color', 'flood-opacity']),
    // Gaussian Blur effect
    gaussianBlur: function (x = 0, y = x) {
      this.attr('stdDeviation', x + ' ' + y);
    },
    // Image effect
    image: function (src) {
      this.attr('href', src, svg_js.namespaces.xlink);
    },
    // Morphology effect
    morphology: getAttrSetter(['operator', 'radius']),
    // Offset effect
    offset: getAttrSetter(['dx', 'dy']),
    // SpecularLighting effect
    specularLighting: getAttrSetter(['surfaceScale', 'lightingColor', 'diffuseConstant', 'specularExponent', 'kernelUnitLength']),
    // Tile effect
    tile: getAttrSetter([]),
    // Turbulence effect
    turbulence: getAttrSetter(['baseFrequency', 'numOctaves', 'seed', 'stitchTiles', 'type'])
  };
  const filterNames = ['blend', 'colorMatrix', 'componentTransfer', 'composite', 'convolveMatrix', 'diffuseLighting', 'displacementMap', 'dropShadow', 'flood', 'gaussianBlur', 'image', 'merge', 'morphology', 'offset', 'specularLighting', 'tile', 'turbulence']; // For every filter create a class

  filterNames.forEach(effect => {
    const name = svg_js.utils.capitalize(effect);
    const fn = updateFunctions[effect];
    Filter[name + 'Effect'] = class extends Effect {
      constructor(node) {
        super(svg_js.nodeOrNew('fe' + name, node), node);
      } // This function takes all parameters from the factory call
      // and updates the attributes according to the updateFunctions


      update(args) {
        fn.apply(this, args);
        return this;
      }

    }; // Add factory function to filter
    // Allow to pass a function or object
    // The attr object is catched from "wrapWithAttrCheck"

    Filter.prototype[effect] = svg_js.wrapWithAttrCheck(function (fn, ...args) {
      const effect = new Filter[name + 'Effect']();
      if (fn == null) return this.put(effect); // For Effects which can take children, a function is allowed

      if (typeof fn === 'function') {
        fn.call(effect, effect);
      } else {
        // In case it is not a function, add it to arguments
        args.unshift(fn);
      }

      return this.put(effect).update(args);
    });
  }); // Correct factories which are not that simple

  svg_js.extend(Filter, {
    merge(arrayOrFn) {
      const node = this.put(new Filter.MergeEffect()); // If a function was passed, execute it
      // That makes stuff like this possible:
      // filter.merge((mergeEffect) => mergeEffect.mergeNode(in))

      if (typeof arrayOrFn === 'function') {
        arrayOrFn.call(node, node);
        return node;
      } // Check if first child is an array, otherwise use arguments as array


      const children = arrayOrFn instanceof Array ? arrayOrFn : [...arguments];
      children.forEach(child => {
        if (child instanceof Filter.MergeNode) {
          node.put(child);
        } else {
          node.mergeNode(child);
        }
      });
      return node;
    },

    componentTransfer(components = {}) {
      const node = this.put(new Filter.ComponentTransferEffect());

      if (typeof components === 'function') {
        components.call(node, node);
        return node;
      } // If no component is set, we use the given object for all components


      if (!components.r && !components.g && !components.b && !components.a) {
        const temp = components;
        components = {
          r: temp,
          g: temp,
          b: temp,
          a: temp
        };
      }

      for (const c in components) {
        // components[c] has to hold an attributes object
        node.add(new Filter['Func' + c.toUpperCase()](components[c]));
      }

      return node;
    }

  });
  const filterChildNodes = ['distantLight', 'pointLight', 'spotLight', 'mergeNode', 'FuncR', 'FuncG', 'FuncB', 'FuncA'];
  filterChildNodes.forEach(child => {
    const name = svg_js.utils.capitalize(child);
    Filter[name] = class extends Effect {
      constructor(node) {
        super(svg_js.nodeOrNew('fe' + name, node), node);
      }

    };
  });
  const componentFuncs = ['funcR', 'funcG', 'funcB', 'funcA']; // Add an update function for componentTransfer-children

  componentFuncs.forEach(function (c) {
    const _class = Filter[svg_js.utils.capitalize(c)];
    const fn = svg_js.wrapWithAttrCheck(function () {
      return this.put(new _class());
    });
    Filter.ComponentTransferEffect.prototype[c] = fn;
  });
  const lights = ['distantLight', 'pointLight', 'spotLight']; // Add light sources factories to lightining effects

  lights.forEach(light => {
    const _class = Filter[svg_js.utils.capitalize(light)];
    const fn = svg_js.wrapWithAttrCheck(function () {
      return this.put(new _class());
    });
    Filter.DiffuseLightingEffect.prototype[light] = fn;
    Filter.SpecularLightingEffect.prototype[light] = fn;
  });
  svg_js.extend(Filter.MergeEffect, {
    mergeNode(_in) {
      return this.put(new Filter.MergeNode()).attr('in', _in);
    }

  }); // add .filter function

  svg_js.extend(svg_js.Defs, {
    // Define filter
    filter: function (block) {
      const filter = this.put(new Filter());
      /* invoke passed block */

      if (typeof block === 'function') {
        block.call(filter, filter);
      }

      return filter;
    }
  });
  svg_js.extend(svg_js.Container, {
    // Define filter on defs
    filter: function (block) {
      return this.defs().filter(block);
    }
  });
  svg_js.extend(svg_js.Element, {
    // Create filter element in defs and store reference
    filterWith: function (block) {
      const filter = block instanceof Filter ? block : this.defs().filter(block);
      return this.attr('filter', filter);
    },
    // Remove filter
    unfilter: function (remove) {
      /* remove filter attribute */
      return this.attr('filter', null);
    },

    filterer() {
      return this.reference('filter');
    }

  }); // chaining

  const chainingEffects = {
    // Blend effect
    blend: function (in2, mode) {
      return this.parent() && this.parent().blend(this, in2, mode); // pass this as the first input
    },
    // ColorMatrix effect
    colorMatrix: function (type, values) {
      return this.parent() && this.parent().colorMatrix(type, values).in(this);
    },
    // ComponentTransfer effect
    componentTransfer: function (components) {
      return this.parent() && this.parent().componentTransfer(components).in(this);
    },
    // Composite effect
    composite: function (in2, operator) {
      return this.parent() && this.parent().composite(this, in2, operator); // pass this as the first input
    },
    // ConvolveMatrix effect
    convolveMatrix: function (matrix) {
      return this.parent() && this.parent().convolveMatrix(matrix).in(this);
    },
    // DiffuseLighting effect
    diffuseLighting: function (surfaceScale, lightingColor, diffuseConstant, kernelUnitLength) {
      return this.parent() && this.parent().diffuseLighting(surfaceScale, diffuseConstant, kernelUnitLength).in(this);
    },
    // DisplacementMap effect
    displacementMap: function (in2, scale, xChannelSelector, yChannelSelector) {
      return this.parent() && this.parent().displacementMap(this, in2, scale, xChannelSelector, yChannelSelector); // pass this as the first input
    },
    // DisplacementMap effect
    dropShadow: function (x, y, stdDeviation) {
      return this.parent() && this.parent().dropShadow(this, x, y, stdDeviation).in(this); // pass this as the first input
    },
    // Flood effect
    flood: function (color, opacity) {
      return this.parent() && this.parent().flood(color, opacity); // this effect dont have inputs
    },
    // Gaussian Blur effect
    gaussianBlur: function (x, y) {
      return this.parent() && this.parent().gaussianBlur(x, y).in(this);
    },
    // Image effect
    image: function (src) {
      return this.parent() && this.parent().image(src); // this effect dont have inputs
    },
    // Merge effect
    merge: function (arg) {
      arg = arg instanceof Array ? arg : [...arg];
      return this.parent() && this.parent().merge(this, ...arg); // pass this as the first argument
    },
    // Morphology effect
    morphology: function (operator, radius) {
      return this.parent() && this.parent().morphology(operator, radius).in(this);
    },
    // Offset effect
    offset: function (dx, dy) {
      return this.parent() && this.parent().offset(dx, dy).in(this);
    },
    // SpecularLighting effect
    specularLighting: function (surfaceScale, lightingColor, diffuseConstant, specularExponent, kernelUnitLength) {
      return this.parent() && this.parent().specularLighting(surfaceScale, diffuseConstant, specularExponent, kernelUnitLength).in(this);
    },
    // Tile effect
    tile: function () {
      return this.parent() && this.parent().tile().in(this);
    },
    // Turbulence effect
    turbulence: function (baseFrequency, numOctaves, seed, stitchTiles, type) {
      return this.parent() && this.parent().turbulence(baseFrequency, numOctaves, seed, stitchTiles, type).in(this);
    }
  };
  svg_js.extend(Effect, chainingEffects); // Effect-specific extensions

  svg_js.extend(Filter.MergeEffect, {
    in: function (effect) {
      if (effect instanceof Filter.MergeNode) {
        this.add(effect, 0);
      } else {
        this.add(new Filter.MergeNode().in(effect), 0);
      }

      return this;
    }
  });
  svg_js.extend([Filter.CompositeEffect, Filter.BlendEffect, Filter.DisplacementMapEffect], {
    in2: function (effect) {
      if (effect == null) {
        const in2 = this.attr('in2');
        const ref = this.parent() && this.parent().find(`[result="${in2}"]`)[0];
        return ref || in2;
      }

      return this.attr('in2', effect);
    }
  }); // Presets

  Filter.filter = {
    sepiatone: [0.343, 0.669, 0.119, 0, 0, 0.249, 0.626, 0.130, 0, 0, 0.172, 0.334, 0.111, 0, 0, 0.000, 0.000, 0.000, 1, 0]
  };

  return Filter;

})(SVG);
//# sourceMappingURL=svg.filter.js.map
