# @isaacs/string-locale-compare

Compare strings with Intl.Collator if available, falling back to
String.localeCompare otherwise.

This also forces the use of a specific locale, to avoid using the system
locale, which is non-deterministic.

## USAGE

```js
const stringLocaleCompare = require('@isaacs/string-locale-compare')

myArrayOfStrings.sort(stringLocaleCompare('en'))

// can also pass extra options
myArrayOfNumericStrings.sort(stringLocaleCompare('en', { numeric: true }))
```

## API

`stringLocaleCompare(locale, [options])`

Locale is required, must be a valid locale string.

Options is optional.  The following options are supported:

* `sensitivity`
* `numeric`
* `ignorePunctuation`
* `caseFirst`
