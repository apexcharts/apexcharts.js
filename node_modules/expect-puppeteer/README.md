# expect-puppeteer

[![npm version](https://img.shields.io/npm/v/expect-puppeteer.svg)](https://www.npmjs.com/package/expect-puppeteer)
[![npm dm](https://img.shields.io/npm/dm/expect-puppeteer.svg)](https://www.npmjs.com/package/expect-puppeteer)
[![npm dt](https://img.shields.io/npm/dt/expect-puppeteer.svg)](https://www.npmjs.com/package/expect-puppeteer)

Assertion library for Puppeteer.

```
npm install expect-puppeteer
```

## Usage

Modify your Jest configuration:

```json
{
  "setupFilesAfterEnv": ["expect-puppeteer"]
}
```

## Why do I need it

Writing integration test is very hard, especially when you are testing a Single Page Applications. Data are loaded asynchronously and it is difficult to know exactly when an element will be displayed in the page.

[Puppeteer API](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md) is great, but it is low level and not designed for integration testing.

This API is designed for integration testing:

- It will wait for element before running an action
- It adds additional feature like matching an element using text

**Example**

```js
// Does not work if button is not in page
await page.click("button");

// Will try for 500ms to click on "button"
await page.toClick("button");

// Will click the first button with a "My button" text inside
await page.toClick("button", { text: "My button" });
```

The first element to match will be selected

**Example**

```html
<div class="outer">
  <div class="inner">some text</div>
</div>
```

```js
// Will match outer div
await expect(page).toMatchElement("div", { text: "some text" });

// Will match inner div
await expect(page).toMatchElement("div.inner", { text: "some text" });
```

## API

##### Table of Contents

<!-- toc -->

- [toClick](#user-content-toClick)
- [toDisplayDialog](#user-content-toDisplayDialog)
- [toFill](#user-content-toFill)
- [toFillForm](#user-content-toFillForm)
- [toMatchTextContent](#user-content-toMatchTextContent)
- [toMatchElement](#user-content-toMatchElement)
- [toSelect](#user-content-toSelect)
- [toUploadFile](#user-content-toUploadFile)

### <a name="toClick"></a>expect(instance).toClick(selector[, options])

Expect an element to be in the page or element, then click on it.

- `instance` <[Page]|[ElementHandle]> Context
- `selector` <[string]|[MatchSelector](#MatchSelector)> A [selector] or a [MatchSelector](#MatchSelector) to click on.
- `options` <[Object]> Optional parameters
  - `button` <"left"|"right"|"middle"> Defaults to `left`.
  - `clickCount` <[number]> defaults to 1. See [UIEvent.detail].
  - `delay` <[number]> Time to wait between `mousedown` and `mouseup` in milliseconds. Defaults to 0.
  - `text` <[string]|[RegExp]> A text or a RegExp to match in element `textContent`.

```js
await expect(page).toClick("button", { text: "Home" });
await expect(page).toClick({ type: "xpath", value: "\\a" }, { text: "Click" });
```

### <a name="toDisplayDialog"></a>expect(page).toDisplayDialog(block)

Expect block function to trigger a dialog and returns it.

- `page` <[Page]> Context
- `block` <[function]> A [function] that should trigger a dialog

```js
const dialog = await expect(page).toDisplayDialog(async () => {
  await expect(page).toClick("button", { text: "Show dialog" });
});
```

### <a name="toFill"></a>expect(instance).toFill(selector, value[, options])

Expect a control to be in the page or element, then fill it with text.

- `instance` <[Page]|[ElementHandle]> Context
- `selector` <[string]> A [selector] to match field
- `value` <[string]> Value to fill
- `options` <[Object]> Optional parameters
  - `delay` <[number]> delay to pass to [the puppeteer `element.type` API](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#elementhandletypetext-options)

```js
await expect(page).toFill('input[name="firstName"]', "James");
```

### <a name="toFillForm"></a>expect(instance).toFillForm(selector, values[, options])

Expect a form to be in the page or element, then fill its controls.

- `instance` <[Page]|[ElementHandle]> Context
- `selector` <[string]> A [selector] to match form
- `values` <[Object]> Values to fill
- `options` <[Object]> Optional parameters
  - `delay` <[number]> delay to pass to [the puppeteer `element.type` API](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#elementhandletypetext-options)

```js
await expect(page).toFillForm('form[name="myForm"]', {
  firstName: "James",
  lastName: "Bond",
});
```

### <a name="toMatchTextContent"></a>expect(instance).toMatchTextContent(matcher[, options])

Expect a text or a string RegExp to be present in the page or element.

- `instance` <[Page]|[ElementHandle]> Context
- `matcher` <[string]|[RegExp]> A text or a RegExp to match in page
- `options` <[Object]> Optional parameters
  - `polling` <[string]|[number]> An interval at which the `pageFunction` is executed, defaults to `raf`. If `polling` is a number, then it is treated as an interval in milliseconds at which the function would be executed. If `polling` is a string, then it can be one of the following values:
    - `raf` - to constantly execute `pageFunction` in `requestAnimationFrame` callback. This is the tightest polling mode which is suitable to observe styling changes.
    - `mutation` - to execute `pageFunction` on every DOM mutation.
  - `timeout` <[number]> maximum time to wait for in milliseconds. Defaults to `30000` (30 seconds). Pass `0` to disable timeout. The default value can be changed by using the [page.setDefaultTimeout(timeout)](#pagesetdefaulttimeouttimeout) method.
  - `traverseShadowRoots`<[boolean]> Whether shadow roots should be traversed to find a match.

```js
// Matching using text
await expect(page).toMatchTextContent("Lorem ipsum");
// Matching using RegExp
await expect(page).toMatchTextContent(/lo.*/);
```

### <a name="toMatchElement"></a>expect(instance).toMatchElement(selector[, options])

Expect an element be present in the page or element.

- `instance` <[Page]|[ElementHandle]> Context
- `selector` <[string]> A [selector] to match element
- `options` <[Object]> Optional parameters
  - `polling` <[string]|[number]> An interval at which the `pageFunction` is executed, defaults to `raf`. If `polling` is a number, then it is treated as an interval in milliseconds at which the function would be executed. If `polling` is a string, then it can be one of the following values:
    - `raf` - to constantly execute `pageFunction` in `requestAnimationFrame` callback. This is the tightest polling mode which is suitable to observe styling changes.
    - `mutation` - to execute `pageFunction` on every DOM mutation.
  - `timeout` <[number]> maximum time to wait for in milliseconds. Defaults to `30000` (30 seconds). Pass `0` to disable timeout. The default value can be changed by using the [page.setDefaultTimeout(timeout)](#pagesetdefaulttimeouttimeout) method.
  - `text` <[string]|[RegExp]> A text or a RegExp to match in element `textContent`.
  - `visible` <[boolean]> wait for element to be present in DOM and to be visible, i.e. to not have `display: none` or `visibility: hidden` CSS properties. Defaults to `false`.

```js
// Select a row containing a text
const row = await expect(page).toMatchElement("tr", { text: "My row" });
// Click on the third column link
await expect(row).toClick("td:nth-child(3) a");
```

### <a name="toSelect"></a>expect(instance).toSelect(selector, valueOrText)

Expect a select control to be present in the page or element, then select the specified option.

- `instance` <[Page]|[ElementHandle]> Context
- `selector` <[string]> A [selector] to match select [element]
- `valueOrText` <[string]> Value or text matching option

```js
await expect(page).toSelect('select[name="choices"]', "Choice 1");
```

### <a name="toUploadFile"></a>expect(instance).toUploadFile(selector, filePath)

Expect a input file control to be present in the page or element, then fill it with a local file.

- `instance` <[Page]|[ElementHandle]> Context
- `selector` <[string]> A [selector] to match input [element]
- `filePath` <[string]> A file path

```js
import { join } from "node:path";

await expect(page).toUploadFile(
  'input[type="file"]',
  join(__dirname, "file.txt"),
);
```

### <a name="MatchSelector"></a>{type: [string], value: [string]}

An object used as parameter in order to select an element.

- `type` <"xpath"|"css"> The type of the selector
- `value` <[string]> The value of the selector

```js
{type:'css', value:'form[name="myForm"]'}
{type:'xpath', value:'.\\a'}
```

## Configure default options

To configure default options like `timeout`, `expect-puppeteer` exposes two methods: `getDefaultOptions` and `setDefaultOptions`. You can find available options in [Puppeteer `page.waitForFunction` documentation](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagewaitforfunctionpagefunction-options-args). Default options are set to: `{ timeout: 500 }`.

```js
import { setDefaultOptions } from "expect-puppeteer";

setDefaultOptions({ timeout: 1000 });
```

[array]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array "Array"
[boolean]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Boolean_type "Boolean"
[function]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function "Function"
[number]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type "Number"
[object]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object "Object"
[promise]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise "Promise"
[regexp]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp "RegExp"
[string]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type "String"
[error]: https://nodejs.org/api/errors.html#errors_class_error "Error"
[element]: https://developer.mozilla.org/en-US/docs/Web/API/element "Element"
[map]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map "Map"
[selector]: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors "selector"
[page]: https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#class-page "Page"
[elementhandle]: https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#class-elementhandle "ElementHandle"
[uievent.detail]: https://developer.mozilla.org/en-US/docs/Web/API/UIEvent/detail
