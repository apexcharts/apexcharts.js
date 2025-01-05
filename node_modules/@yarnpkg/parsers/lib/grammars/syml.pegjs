{
  const INDENT_STEP = 2;

  let indentLevel = 0;
}

Start
  = PropertyStatements

ItemStatements
  = statements:ItemStatement* { return [].concat(... statements) }

ItemStatement
  = Samedent "-" B value:Expression { return value }

PropertyStatements
  = statements:PropertyStatement* { return Object.assign({}, ... statements) }

PropertyStatement
  = B? ("#" (!EOL .)+)? EOL_ANY+ { return {} }
  / Samedent property:Name B? ":" B? value:Expression { return {[property]: value} }
  // Compatibility with the old lockfile format (key-values without a ":")
  / Samedent property:LegacyName B? ":" B? value:Expression { return {[property]: value} }
  // Compatibility with the old lockfile format (key-values without a ":")
  / Samedent property:LegacyName B value:LegacyLiteral EOL_ANY+ { return {[property]: value} }
  // Compatibility with the old lockfile format (multiple keys for a same value)
  / Samedent property:LegacyName others:(B? "," B? other:LegacyName { return other })+ B? ":" B? value:Expression { return Object.assign({}, ... [property].concat(others).map(property => ({[property]: value}))) }

Expression
  =  &(EOL Extradent "-" B) EOL_ANY Indent statements:ItemStatements Dedent { return statements }
  / EOL Indent statements:PropertyStatements Dedent { return statements }
  / expression:Literal EOL_ANY+ { return expression }

Samedent "correct indentation"
  = spaces:" "* &{ return spaces.length === indentLevel * INDENT_STEP }

Extradent
  = spaces:" "* &{ return spaces.length === (indentLevel + 1) * INDENT_STEP }

Indent
  = &{ indentLevel++; return true }

Dedent
  = &{ indentLevel--; return true }

Name
  = string
  / pseudostring

LegacyName
  = string
  / pseudostringLegacy+ { return text() }

Literal
  = null
  / boolean
  / string
  / pseudostring

LegacyLiteral
  = null
  / string
  / pseudostringLegacy

/**
 */

pseudostring "pseudostring"
  = [^\r\n\t ?:,\][{}#&*!|>'"%@`-] (B? [^\r\n\t ,\][{}:#"'])* { return text().replace(/^ *| *$/g, '') }

pseudostringLegacy
  = "--"? [a-zA-Z\/0-9] [^\r\n\t :,]* { return text().replace(/^ *| *$/g, '') }

/**
 * String parsing
 */

null
  = "null" { return null }

boolean
  = "true" { return true }
  / "false" { return false }

string "string"
  = '"' '"' { return "" }
  / '"' chars:chars '"' { return chars }

chars
  = chars:char+ { return chars.join(``) }

char
  = [^"\\\0-\x1F\x7f]
  / '\\"' { return `"` }
  / "\\\\" { return `\\` }
  / "\\/" { return `/`  }
  / "\\b" { return `\b` }
  / "\\f" { return `\f` }
  / "\\n" { return `\n` }
  / "\\r" { return `\r` }
  / "\\t" { return `\t` }
  / "\\u" h1:hexDigit h2:hexDigit h3:hexDigit h4:hexDigit {
      return String.fromCharCode(parseInt(`0x${h1}${h2}${h3}${h4}`));
    }

hexDigit
  = [0-9a-fA-F]

/**
 * Spaces
 */

B "blank space"
  = [ \t]+

S "white space"
  = [ \t\n\r]+

EOL_ANY
  = EOL (B? EOL)*

EOL
  = "\r\n"
  / "\n"
  / "\r"
