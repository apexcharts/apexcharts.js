(function () {
  'use strict';

  /* Polyfill service v3.16.0
   * For detailed credits and licence information see https://github.com/financial-times/polyfill-service.
   *
   * UA detected: ie/9.0.0
   * Features requested: CustomEvent
   *
   * - Event, License: CC0 (required by "CustomEvent")
   * - CustomEvent, License: CC0 */

  function CustomEventPolyfill() {
    (function (undefined$1) {
      if (!((function (global) {

          if (!('Event' in global)) return false;
          if (typeof global.Event === 'function') return true;

          try {

            // In IE 9-11, the Event object exists but cannot be instantiated
            new Event('click');
            return true;
          } catch (e) {
            return false;
          }
        }(this)))) {

  // Event
        (function () {
          var unlistenableWindowEvents = {
            click: 1,
            dblclick: 1,
            keyup: 1,
            keypress: 1,
            keydown: 1,
            mousedown: 1,
            mouseup: 1,
            mousemove: 1,
            mouseover: 1,
            mouseenter: 1,
            mouseleave: 1,
            mouseout: 1,
            storage: 1,
            storagecommit: 1,
            textinput: 1
          };

          function indexOf(array, element) {
            var
              index = -1,
              length = array.length;

            while (++index < length) {
              if (index in array && array[index] === element) {
                return index;
              }
            }

            return -1;
          }

          var existingProto = (window.Event && window.Event.prototype) || null;
          window.Event = Window.prototype.Event = function Event(type, eventInitDict) {
            if (!type) {
              throw new Error('Not enough arguments');
            }

            // Shortcut if browser supports createEvent
            if ('createEvent' in document) {
              var event = document.createEvent('Event');
              var bubbles = eventInitDict && eventInitDict.bubbles !== undefined$1 ?
                eventInitDict.bubbles : false;
              var cancelable = eventInitDict && eventInitDict.cancelable !== undefined$1 ?
                eventInitDict.cancelable : false;

              event.initEvent(type, bubbles, cancelable);

              return event;
            }

            var event = document.createEventObject();

            event.type = type;
            event.bubbles =
              eventInitDict && eventInitDict.bubbles !== undefined$1 ? eventInitDict.bubbles : false;
            event.cancelable =
              eventInitDict && eventInitDict.cancelable !== undefined$1 ? eventInitDict.cancelable :
                false;

            return event;
          };
          if (existingProto) {
            Object.defineProperty(window.Event, 'prototype', {
              configurable: false,
              enumerable: false,
              writable: true,
              value: existingProto
            });
          }

          if (!('createEvent' in document)) {
            window.addEventListener = Window.prototype.addEventListener =
              Document.prototype.addEventListener =
                Element.prototype.addEventListener = function addEventListener() {
                  var
                    element = this,
                    type = arguments[0],
                    listener = arguments[1];

                  if (element === window && type in unlistenableWindowEvents) {
                    throw new Error('In IE8 the event: ' + type +
                      ' is not available on the window object.');
                  }

                  if (!element._events) {
                    element._events = {};
                  }

                  if (!element._events[type]) {
                    element._events[type] = function (event) {
                      var
                        list = element._events[event.type].list,
                        events = list.slice(),
                        index = -1,
                        length = events.length,
                        eventElement;

                      event.preventDefault = function preventDefault() {
                        if (event.cancelable !== false) {
                          event.returnValue = false;
                        }
                      };

                      event.stopPropagation = function stopPropagation() {
                        event.cancelBubble = true;
                      };

                      event.stopImmediatePropagation = function stopImmediatePropagation() {
                        event.cancelBubble = true;
                        event.cancelImmediate = true;
                      };

                      event.currentTarget = element;
                      event.relatedTarget = event.fromElement || null;
                      event.target = event.target || event.srcElement || element;
                      event.timeStamp = new Date().getTime();

                      if (event.clientX) {
                        event.pageX = event.clientX + document.documentElement.scrollLeft;
                        event.pageY = event.clientY + document.documentElement.scrollTop;
                      }

                      while (++index < length && !event.cancelImmediate) {
                        if (index in events) {
                          eventElement = events[index];

                          if (indexOf(list, eventElement) !== -1 &&
                            typeof eventElement === 'function') {
                            eventElement.call(element, event);
                          }
                        }
                      }
                    };

                    element._events[type].list = [];

                    if (element.attachEvent) {
                      element.attachEvent('on' + type, element._events[type]);
                    }
                  }

                  element._events[type].list.push(listener);
                };

            window.removeEventListener = Window.prototype.removeEventListener =
              Document.prototype.removeEventListener =
                Element.prototype.removeEventListener = function removeEventListener() {
                  var
                    element = this,
                    type = arguments[0],
                    listener = arguments[1],
                    index;

                  if (element._events && element._events[type] && element._events[type].list) {
                    index = indexOf(element._events[type].list, listener);

                    if (index !== -1) {
                      element._events[type].list.splice(index, 1);

                      if (!element._events[type].list.length) {
                        if (element.detachEvent) {
                          element.detachEvent('on' + type, element._events[type]);
                        }
                        delete element._events[type];
                      }
                    }
                  }
                };

            window.dispatchEvent = Window.prototype.dispatchEvent = Document.prototype.dispatchEvent =
              Element.prototype.dispatchEvent = function dispatchEvent(event) {
                if (!arguments.length) {
                  throw new Error('Not enough arguments');
                }

                if (!event || typeof event.type !== 'string') {
                  throw new Error('DOM Events Exception 0');
                }

                var element = this, type = event.type;

                try {
                  if (!event.bubbles) {
                    event.cancelBubble = true;

                    var cancelBubbleEvent = function (event) {
                      event.cancelBubble = true;

                      (element || window).detachEvent('on' + type, cancelBubbleEvent);
                    };

                    this.attachEvent('on' + type, cancelBubbleEvent);
                  }

                  this.fireEvent('on' + type, event);
                } catch (error) {
                  event.target = element;

                  do {
                    event.currentTarget = element;

                    if ('_events' in element && typeof element._events[type] === 'function') {
                      element._events[type].call(element, event);
                    }

                    if (typeof element['on' + type] === 'function') {
                      element['on' + type].call(element, event);
                    }

                    element = element.nodeType === 9 ? element.parentWindow : element.parentNode;
                  } while (element && !event.cancelBubble);
                }

                return true;
              };

            // Add the DOMContentLoaded Event
            document.attachEvent('onreadystatechange', function () {
              if (document.readyState === 'complete') {
                document.dispatchEvent(new Event('DOMContentLoaded', {
                  bubbles: true
                }));
              }
            });
          }
        }());

      }

      if (!('CustomEvent' in this &&

  // In Safari, typeof CustomEvent == 'object' but it otherwise works fine
        (typeof this.CustomEvent === 'function' ||
        (this.CustomEvent.toString().indexOf('CustomEventConstructor') > -1)))) {

  // CustomEvent
        this.CustomEvent = function CustomEvent(type, eventInitDict) {
          if (!type) {
            throw Error(
              'TypeError: Failed to construct "CustomEvent": An event name must be provided.');
          }

          var event;
          eventInitDict = eventInitDict || {bubbles: false, cancelable: false, detail: null};

          if ('createEvent' in document) {
            try {
              event = document.createEvent('CustomEvent');
              event.initCustomEvent(type, eventInitDict.bubbles, eventInitDict.cancelable,
                eventInitDict.detail);
            } catch (error) {
              // for browsers which don't support CustomEvent at all, we use a regular event instead
              event = document.createEvent('Event');
              event.initEvent(type, eventInitDict.bubbles, eventInitDict.cancelable);
              event.detail = eventInitDict.detail;
            }
          } else {

            // IE8
            event = new Event(type, eventInitDict);
            event.detail = eventInitDict && eventInitDict.detail || null;
          }
          return event;
        };

        CustomEvent.prototype = Event.prototype;

      }

    }).call('object' === typeof window && window || 'object' === typeof self && self ||
      'object' === typeof global && global || {});
  }

  // Map function

  // Filter function
  function filter(array, block) {
    let i;
    const il = array.length;
    const result = [];

    for (i = 0; i < il; i++) {
      if (block(array[i])) {
        result.push(array[i]);
      }
    }

    return result
  }

  // IE11: children does not work for svg nodes
  function children(node) {
    return filter(node.childNodes, function (child) {
      return child.nodeType === 1
    })
  }

  (function () {
    try {
      if (SVGElement.prototype.innerHTML) return
    } catch (e) {
      return
    }

    const serializeXML = function (node, output) {
      const nodeType = node.nodeType;
      if (nodeType === 3) {
        output.push(
          node.textContent
            .replace(/&/, '&amp;')
            .replace(/</, '&lt;')
            .replace('>', '&gt;')
        );
      } else if (nodeType === 1) {
        output.push('<', node.tagName);
        if (node.hasAttributes()) {
  [].forEach.call(node.attributes, function (attrNode) {
            output.push(' ', attrNode.name, '="', attrNode.value, '"');
          });
        }
        output.push('>');
        if (node.hasChildNodes()) {
  [].forEach.call(node.childNodes, function (childNode) {
            serializeXML(childNode, output);
          });
        }
        output.push('</', node.tagName, '>');
      } else if (nodeType === 8) {
        output.push('<!--', node.nodeValue, '-->');
      }
    };

    Object.defineProperty(SVGElement.prototype, 'innerHTML', {
      get: function () {
        const output = [];
        let childNode = this.firstChild;
        while (childNode) {
          serializeXML(childNode, output);
          childNode = childNode.nextSibling;
        }
        return output.join('')
      },
      set: function (markupText) {
        while (this.firstChild) {
          this.removeChild(this.firstChild);
        }

        try {
          const dXML = new DOMParser();
          dXML.async = false;

          const sXML =
            "<svg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink'>" +
            markupText +
            '</svg>';
          const svgDocElement = dXML.parseFromString(
            sXML,
            'text/xml'
          ).documentElement;

          let childNode = svgDocElement.firstChild;
          while (childNode) {
            this.appendChild(this.ownerDocument.importNode(childNode, true));
            childNode = childNode.nextSibling;
          }
        } catch (e) {
          throw new Error('Can not set innerHTML on node')
        }
      }
    });

    Object.defineProperty(SVGElement.prototype, 'outerHTML', {
      get: function () {
        const output = [];
        serializeXML(this, output);
        return output.join('')
      },
      set: function (markupText) {
        while (this.firstChild) {
          this.removeChild(this.firstChild);
        }

        try {
          const dXML = new DOMParser();
          dXML.async = false;

          const sXML =
            "<svg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink'>" +
            markupText +
            '</svg>';
          const svgDocElement = dXML.parseFromString(
            sXML,
            'text/xml'
          ).documentElement;

          let childNode = svgDocElement.firstChild;
          while (childNode) {
            this.parentNode.insertBefore(
              this.ownerDocument.importNode(childNode, true),
              this
            );
            // this.appendChild(this.ownerDocument.importNode(childNode, true));
            childNode = childNode.nextSibling;
          }
        } catch (e) {
          throw new Error('Can not set outerHTML on node')
        }
      }
    });
  })();

  /* global SVGElement */
  /* eslint no-new-object: "off" */


  /* IE 11 has no correct CustomEvent implementation */
  CustomEventPolyfill();

  /* IE 11 has no children on SVGElement */
  try {
    if (!SVGElement.prototype.children) {
      Object.defineProperty(SVGElement.prototype, 'children', {
        get: function () {
          return children(this)
        }
      });
    }
  } catch (e) {}

  /* IE 11 cannot handle getPrototypeOf(not_obj) */
  try {
    delete Object.getPrototypeOf('test');
  } catch (e) {
    var old = Object.getPrototypeOf;
    Object.getPrototypeOf = function (o) {
      if (typeof o !== 'object') o = new Object(o);
      return old.call(this, o)
    };
  }

})();
