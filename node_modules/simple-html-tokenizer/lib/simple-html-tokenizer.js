/*jshint boss:true*/
import Tokenizer from './simple-html-tokenizer/tokenizer';
import tokenize from './simple-html-tokenizer/tokenize';
import Generator from './simple-html-tokenizer/generator';
import generate from './simple-html-tokenizer/generate';
import { StartTag, EndTag, Chars, Comment } from './simple-html-tokenizer/tokens';

export { Tokenizer, tokenize, Generator, generate, StartTag, EndTag, Chars, Comment };
