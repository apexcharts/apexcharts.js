resolution =
  from:specifier "/" descriptor:specifier { return { from, descriptor } }
/ descriptor:specifier { return { descriptor } }

specifier =
  fullName:fullName "@" description:description { return { fullName, description } }
/ fullName:fullName { return { fullName } }

fullName =
  "@" ident "/" ident { return text() }
/ ident { return text() }

ident =
  [^/@]+ { return text() }

description =
  [^/]+ { return text() }
