var escape =  (function () {
  var test = /[&<>"'`]/;
  var replace = /[&<>"'`]/g;
  var map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "`": "&#x60;"
  };
  function escapeChar(char) {
    return map[char];
  }
  return function escape(string) {
    if(!test.test(string)) {
      return string;
    }
    return string.replace(replace, escapeChar);
  };
}());

function Generator() {
  this.escape = escape;
}

Generator.prototype = {
  generate: function (tokens) {
    var buffer = '';
    var token;
    for (var i=0; i<tokens.length; i++) {
      token = tokens[i];
      buffer += this[token.type](token);
    }
    return buffer;
  },

  escape: function (text) {
    var unsafeCharsMap = this.unsafeCharsMap;
    return text.replace(this.unsafeChars, function (char) {
      return unsafeCharsMap[char] || char;
    });
  },

  StartTag: function (token) {
    var out = "<";
    out += token.tagName;

    if (token.attributes.length) {
      out += " " + this.Attributes(token.attributes);
    }

    out += ">";

    return out;
  },

  EndTag: function (token) {
    return "</" + token.tagName + ">";
  },

  Chars: function (token) {
    return this.escape(token.chars);
  },

  Comment: function (token) {
    return "<!--" + token.chars + "-->";
  },

  Attributes: function (attributes) {
    var out = [], attribute;

    for (var i=0, l=attributes.length; i<l; i++) {
      attribute = attributes[i];

      out.push(this.Attribute(attribute[0], attribute[1]));
    }

    return out.join(" ");
  },

  Attribute: function (name, value) {
    var attrString = name;

    if (value) {
      value = this.escape(value);
      attrString += "=\"" + value + "\"";
    }

    return attrString;
  }
};

export default Generator;
