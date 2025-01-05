Start
  = S* line:ShellLine? { return line ? line : [] }

ShellLine
  = command:CommandLine S* type:ShellLineType then:ShellLineThen? { return [ { command, type } ].concat(then || []) }
  / command:CommandLine S* type:ShellLineType? { return [ { command, type: type || ';' } ] }

ShellLineThen
  = S* then:ShellLine S* { return then }

ShellLineType
  = ';'
  / '&'

CommandLine
  = chain:CommandChain then:CommandLineThen? { return then ? { chain, then } : { chain } }

CommandLineThen
  = S* type:CommandLineType S* then:CommandLine S* { return { type, line: then } }

CommandLineType
  = '&&'
  / '||'

CommandChain
  = main:Command then:CommandChainThen? { return then ? { ...main, then } : main }

CommandChainThen
  = S* type:CommandChainType S* then:CommandChain S* { return { type, chain: then } }

CommandChainType
  = '|&'
  / '|'

VariableAssignment
  = name:EnvVariable '=' arg:StrictValueArgument S* { return { name, args: [arg] } }
  / name:EnvVariable '=' S* { return { name, args: [] } }

Command
  = S* "(" S* subshell:ShellLine S* ")" S* args:RedirectArgument* S* { return { type: `subshell`, subshell, args } }
  / S* "{" S* group:ShellLine S* "}" S* args:RedirectArgument* S* { return { type: `group`, group, args } }
  / S* envs:VariableAssignment* S* args:Argument+ S* { return { type: `command`, args, envs } }
  / S* envs:VariableAssignment+ S* { return { type: `envs`, envs } }

CommandString
  = S* args:ValueArgument+ S* { return args }

Argument
  = S* arg:RedirectArgument { return arg }
  / S* arg:ValueArgument { return arg }

RedirectArgument
  = S* fd:[0-9]? redirect:RedirectType arg:ValueArgument { return { type: `redirection`, subtype: redirect, fd: fd !== null ? parseInt(fd) : null, args: [arg] } }

RedirectType
  = '>>'
  / '>&'
  / '>'
  / '<<<'
  / '<&'
  / '<'

ValueArgument
  = S* arg:StrictValueArgument { return arg }

StrictValueArgument
  = segments:ArgumentSegment+ { return { type: `argument`, segments: [].concat(... segments) } }

ArgumentSegment
  = string:CQuoteString { return string }
  / string:SglQuoteString { return string }
  / string:DblQuoteString { return string }
  / string:PlainString { return string }

CQuoteString
  = "$'" text:CQuoteStringText "'" { return [ { type: `text`, text } ] }

SglQuoteString
  = "'" text:SglQuoteStringText "'" { return [ { type: `text`, text } ] }

DblQuoteString
  = '""' { return { type: `text`, text: `` } } / '"' segments:DblQuoteStringSegment* '"' { return segments }

PlainString
  = segments:PlainStringSegment+ { return segments }

DblQuoteStringSegment
  = arithmetic:Arithmetic { return { type: `arithmetic`, arithmetic, quoted: true} }
  / shell:Subshell { return { type: `shell`, shell, quoted: true } }
  / variable:Variable { return { type: `variable`, ...variable, quoted: true } }
  / text:DblQuoteStringText { return { type: `text`, text } }

PlainStringSegment
  = arithmetic:Arithmetic { return { type: `arithmetic`, arithmetic, quoted: false} }
  / shell:Subshell { return { type: `shell`, shell, quoted: false } }
  / variable:Variable { return { type: `variable`, ...variable, quoted: false } }
  / pattern:Glob { return { type: `glob`, pattern } }
  / text:PlainStringText { return { type: `text`, text } }

SglQuoteStringText
  = chars:[^']* { return chars.join(``) }

DblQuoteStringText
  = chars:( DblQuoteEscapedChar / [^$"])+ { return chars.join(``) }

DblQuoteEscapedChar
  = '\\\n' { return `` }
  / '\\' c:[\\$"`] { return c }

CQuoteStringText
  = chars:(CQuoteEscapedChar / [^'])* { return chars.join(``) }

CQuoteEscapedChar
  = '\\a' { return '\a' }
  / '\\b' { return '\b' }
  / '\\' [Ee] { return '\x1b' }
  / '\\f' { return '\f' }
  / '\\n' { return '\n' }
  / '\\r' { return '\r' }
  / '\\t' { return '\t' }
  / '\\v' { return '\v' }
  / '\\' c:[\\'"?] { return c }
  / HexCodeString

HexCodeString
  = '\\' c:HexCodeChar0 { return String.fromCharCode(parseInt(c, 16)) }
  / char:('\\x' c:$(HexCodeChar0 HexCodeChar / HexCodeChar0) { return String.fromCharCode(parseInt(c, 16)) })
  / utf8:('\\u' c:$(HexCodeChar HexCodeChar HexCodeChar HexCodeChar) { return String.fromCharCode(parseInt(c, 16)) })
  / utf16:('\\U' c:$(HexCodeChar HexCodeChar HexCodeChar HexCodeChar HexCodeChar HexCodeChar HexCodeChar HexCodeChar) { return String.fromCodePoint(parseInt(c, 16)) })

HexCodeChar0
  = [0-7]

HexCodeChar
  = [0-9a-fA-f]

PlainStringText
  = chars:('\\' c:. { return c } / '{}' { return '{}' } / !SpecialShellChars c:. { return c })+ { return chars.join(``) }

ArithmeticPrimary
  = sign:('-' / '+')? left:[0-9]+ '.' right:[0-9]+ { return { type: `number`, value: (sign === '-' ? -1 : 1) * parseFloat(left.join(``) + `.` + right.join(``)) } }
  / sign:('-' / '+')? value:[0-9]+ { return { type: `number`, value: (sign === '-' ? -1 : 1) *  parseInt(value.join(``)) } }
  / variable:Variable { return { type: `variable`, ...variable } }
  / name:Identifier { return { type: `variable`, name } }
  / '(' S* value:ArithmeticExpression S* ')' { return value }

ArithmeticTimesExpression
  = left:ArithmeticPrimary rest:(S* op:('*' / '/') S* right:ArithmeticPrimary { return { type: op === `*` ? `multiplication` : `division`, right } })* {
    return rest.reduce((left, right) => ({ left, ...right }), left)
  }

ArithmeticExpression
  = left:ArithmeticTimesExpression rest:(S* op:('+' / '-') S* right:ArithmeticTimesExpression { return { type: op === `+` ? `addition` : `subtraction`, right } })* {
    return rest.reduce((left, right) => ({ left, ...right }), left)
  }

Arithmetic
  = '$((' S* arithmetic:ArithmeticExpression S* '))' { return arithmetic }

Subshell
  = '$(' command:ShellLine ')' { return command }

Variable
  = '${' name:Identifier ':-' arg:CommandString '}' { return { name, defaultValue: arg } }
  / '${' name:Identifier ':-}' { return { name, defaultValue: [] } }
  / '${' name:Identifier ':+' arg:CommandString '}' { return { name, alternativeValue: arg } }
  / '${' name:Identifier ':+}' { return { name, alternativeValue: [] } }
  / '${' name:Identifier '}' { return { name } }
  / '$' name:Identifier { return { name } }

Glob
  = pattern:GlobText & { return options.isGlobPattern(pattern) } { return pattern }

GlobText
  = chars:(!GlobSpecialShellChars c:. { return c })+ { return chars.join(``) }

EnvVariable
  = [a-zA-Z0-9_]+ { return text() }

Identifier
  = [$@*?#a-zA-Z0-9_-]+ { return text() }

SpecialShellChars
  = [()}<>$|&; \t"']

GlobSpecialShellChars
  = [<>&; \t"']

S = [ \t]+
