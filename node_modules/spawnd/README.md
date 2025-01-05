# spawnd

[![npm version](https://img.shields.io/npm/v/spawnd.svg)](https://www.npmjs.com/package/spawnd)
[![npm dm](https://img.shields.io/npm/dm/spawnd.svg)](https://www.npmjs.com/package/spawnd)
[![npm dt](https://img.shields.io/npm/dt/spawnd.svg)](https://www.npmjs.com/package/spawnd)

Spawn a process inter-dependent with parent process.

```
npm install spawnd
```

## Usage

```js
import { spawnd } from "spawnd";

const proc = spawnd("node server.js", { shell: true });

proc.destroy().then(() => {
  console.log("Destroyed!");
});
```

## API

### spawnd(command[, args[, options]])

Exactly the same API as [Node.js spawn](https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options).

It returns a [Child Process](https://nodejs.org/api/child_process.html#child_process_class_childprocess) that exposes a destroy method that will kill the process.
