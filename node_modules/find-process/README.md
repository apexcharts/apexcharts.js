# find-process

[![Node.js CI](https://github.com/yibn2008/find-process/actions/workflows/nodejs.yml/badge.svg)](https://github.com/yibn2008/find-process/actions/workflows/nodejs.yml)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

With find-process, you can:

- find the process which is listening specified port
- find the process by pid
- find the process by given name or name pattern

We have covered the difference of main OS platform, including **Mac OSX**, **Linux**, **Windows**
and **Android** (with [Termux](https://termux.com)).

## CLI

Install find-process as a CLI tool:

```sh
$ npm install find-process -g
```

Usage:

```sh

  Usage: find-process [options] <keyword>


  Options:

    -V, --version      output the version number
    -t, --type <type>  find process by keyword type (pid|port|name)
    -p, --port         find process by port
    -h, --help         output usage information

  Examples:

    $ find-process node          # find by name "node"
    $ find-process 111           # find by pid "111"
    $ find-process -p 80         # find by port "80"
    $ find-process -t port 80    # find by port "80"

```

Example:

![image](https://user-images.githubusercontent.com/4136679/62670202-f49a6b00-b9c4-11e9-8692-7003c6c31a8a.png)

## Node API

You can use npm to install:

```sh
$ npm install find-process --save
```

Usage:

```javascript
const find = require('find-process');

find('pid', 12345)
  .then(function (list) {
    console.log(list);
  }, function (err) {
    console.log(err.stack || err);
  })
```

## Synopsis

```
Promise<Array> find(type, value, [options])
```

**Arguments**

- `type` the type of find, support: *port|pid|name*
- `value` the value of type, can be RegExp if type is *name*
- `options` this can either be the *object* described below or *boolean* to just set strict mode
  - `options.strict` the optional strict mode is for checking *port*, *pid*, or *name* exactly matches the given one. (on Windows, `.exe` can be omitted)
  - `options.logLevel` set the logging level to [`trace|debug|info|warn|error`](https://github.com/pimterry/loglevel#documentation). In practice this lets you silence a netstat warning on Linux.

**Return**

The return value of find-process is Promise, if you use **co** you can use `yield find(type, value)` directly.

The resolved value of promise is an array list of process (`[]` means it may be missing on some platforms):

```
[{
  pid: <process id>,
  ppid: [parent process id],
  uid: [user id (for *nix)],
  gid: [user group id (for *nix)],
  name: <command/process name>,
  bin: <execute path (for *nix)>,
  cmd: <full command with args>
}, ...]
```

## Example

Find process which is listening port 80.

```javascript
const find = require('find-process');

find('port', 80)
  .then(function (list) {
    if (!list.length) {
      console.log('port 80 is free now');
    } else {
      console.log('%s is listening port 80', list[0].name);
    }
  })
```

Find process by pid.

```javascript
const find = require('find-process');

find('pid', 12345)
  .then(function (list) {
    console.log(list);
  }, function (err) {
    console.log(err.stack || err);
  });
```

Find all nginx process.

```javascript
const find = require('find-process');

find('name', 'nginx', true)
  .then(function (list) {
    console.log('there are %s nginx process(es)', list.length);
  });
```

Find all nginx processes on Linux without logging a warning when run as a user who isn't root.

```javascript
const find = require('find-process');

find('name', 'nginx', {strict: true, logLevel: 'error'})
  .then(function (list) {
    console.log('there are %s nginx process(es)', list.length);
  });
```
## Contributing

We're welcome to receive Pull Request of bugfix or new feature, but please check the list before sending PR:

- **Coding Style** Please follow the [Standard Style](https://github.com/feross/standard)
- **Documentation** Add documentation for every API change
- **Unit test** Please add unit test for bugfix or new feature

## License

[MIT](LICENSE)

