export function isSpace(char) {
  return (/[\t\n\f ]/).test(char);
}

export function isAlpha(char) {
  return (/[A-Za-z]/).test(char);
}

export function preprocessInput(input) {
  return input.replace(/\r\n?/g, "\n");
}
