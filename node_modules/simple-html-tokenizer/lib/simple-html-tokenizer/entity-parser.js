function EntityParser(namedCodepoints) {
  this.namedCodepoints = namedCodepoints;
}

EntityParser.prototype.parse = function (tokenizer) {
  var input = tokenizer.input.slice(tokenizer.char);
  var matches = input.match(/^#(?:x|X)([0-9A-Fa-f]+);/);
  if (matches) {
    tokenizer.char += matches[0].length;
    return String.fromCharCode(parseInt(matches[1], 16));
  }
  matches = input.match(/^#([0-9]+);/);
  if (matches) {
    tokenizer.char += matches[0].length;
    return String.fromCharCode(parseInt(matches[1], 10));
  }
  matches = input.match(/^([A-Za-z]+);/);
  if (matches) {
    var codepoints = this.namedCodepoints[matches[1]];
    if (codepoints) {
      tokenizer.char += matches[0].length;
      for (var i = 0, buffer = ''; i < codepoints.length; i++) {
        buffer += String.fromCharCode(codepoints[i]);
      }
      return buffer;
    }
  }
};

export default EntityParser;
