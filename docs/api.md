Examples and explanation about how to use micmac

## mockExecution(fn)

mockExecution mock global features (such as setTimeout) and then calls fn. This way when fn gets
called, global features are mocked. After fn gets called features are restored to their original
value.

```javascript
import { mockExecution } from "micmac"

const globalSetTimeout = setTimeout
mockExecution(() => {
  setTimeout === globalSetTimeout // false
})
setTimeout === globalSetTimeout // true
```

Please note that if fn throws, mockExecution restore features because it wraps fn into
`try/finally`.

### mockExecution examples

This section will show many example of how mockExecution is meant to be used. For the brievty of the
examples some `toBeTested` function are declared inline. In your application you would import it
from an external module that you want to test. The examples not declaring `toBeTested` function are
here to show side effects on time related features.

### Promise

```javascript
import { mockExecution } from "micmac"

const toBeTested = () => Promise.resolve()

mockExecution(({ tick }) => {
  let called = false
  toBeTested().then(() => {
    called = true
  })
  called // false
  tick()
  called // true
})
```

### time

```javascript
import { mockExecution } from "micmac"

const toBeTested = (fn) => setTimeout(fn, 10)

mockExecution(({ tick }) => {
  let called = false
  toBeTested(() => {
    called = true
  })
  called // false
  tick(10)
  called // true
})
```

`setInterval/clearInterval`, `setImmediate/clearImmediate`,
`requestAnimationFrame/cancelAnimationFrame` and `process.nextTick` work almost the same. You can
reuse above example with them.

### Date.now()

```javascript
import { mockExecution } from "micmac"

mockExecution(({ tick }) => {
  tick(10)
  Date.now() // 10
})
```

### new Date()

```javascript
import { mockExecution } from "micmac"

mockExecution(({ tick }) => {
  tick(10)
  new Date().getTime() // 10
})
```

### process.uptime()

```javascript
import { mockExecution } from "micmac"

mockExecution(({ tick }) => {
  tick(1000)
  process.uptime() // 1
})
```

### process.hrtime()

```javascript
import { mockExecution } from "micmac"

mockExecution(({ tick }) => {
  tick(1000, 100)
  process.hrtime() // [1, 100]
})
```
