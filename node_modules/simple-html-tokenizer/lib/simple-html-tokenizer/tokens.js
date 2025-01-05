export function StartTag(tagName, attributes, selfClosing) {
  this.type = 'StartTag';
  this.tagName = tagName || '';
  this.attributes = attributes || [];
  this.selfClosing = selfClosing === true;
}

export function EndTag(tagName) {
  this.type = 'EndTag';
  this.tagName = tagName || '';
}

export function Chars(chars) {
  this.type = 'Chars';
  this.chars = chars || "";
}

export function Comment(chars) {
  this.type = 'Comment';
  this.chars = chars || '';
}
