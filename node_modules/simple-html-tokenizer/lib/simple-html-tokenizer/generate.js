import Generator from './generator';

export default function generate(tokens) {
  var generator = new Generator();
  return generator.generate(tokens);
}
