Examples and explanation about how to use micmac

## mockExecution(fn)

mockExecution mock global features (such as setTimeout) and then calls fn.
This way when fn gets called, global features are mocked.
After fn gets called features are restored to their original value.

```javascript
import {mockExecution} from 'micmac'

const globalSetTimeout = setTimeout
mockExecution(
  () => {
    if (setTimeout === globaSetTimeout) {
      throw new Error('setTimeout must be mocked')
    }
  }
)
if (globalSetTimeout !== setTimeout) {
  throw new Error('setTimeout must be restored')
}
```

Please note that if fn throws, mockExecution restore features because it wraps fn into `try/finally`.

### mockExecution examples

This section will show many example of how mockExecution is meant to be used.
For the brievty of the examples some `toBeTested` function are declared inline.
In your application you would import it from an external module that you want to test.
The examples not declaring `toBeTested` function are here to show side effects on time related features.

### Promise (BEST FEATURE)

```javascript
import {mockExecution} from 'micmac'

const toBeTested = () => Promise.resolve()

mockExecution(
  ({tick}) => {
    let called = false
    toBeTested().then(() => {
      called = true
    })
    if (value) {
      throw new Error('called must be false because promise.then(fn) calls fn on next event loop')
    }
    tick()
    if (called === false) {
      throw new Error('called must be true because tick() simulates that an event loop had ellapsed')
    }
  }
)
```

### time

```javascript
import {mockExecution} from 'micmac'

const toBeTested = (fn) => setTimeout(fn, 10)

mockExecution(
  ({tick}) => {
    let called = false
    toBeTested(() => {
      called = true
    })
    if (called) {
      throw new Error("called must be false because 10ms are not ellapsed")
    }
    tick(10)
    if (called === false) {
      throw new Error("called must be true because tick(10) simulates that 10ms had ellapsed")
    }
  }
)
```

`setInterval/clearInterval`, `setImmediate/clearImmediate`, `requestAnimationFrame/cancelAnimationFrame` and `process.nextTick` work almost the same.
You can reuse above example with them.

### new Date() & Date.now()

```javascript
import {mockExecution} from 'micmac'

mockExecution(
  ({tick}) => {
    const now = Date.now()
    tick(10)
    if (new Date().getTime() !== now + 10) {
      throw new Error('new Date() must return now + 10 because tick simulates 10ms had ellapsed')
    }
    if (Date.now() !== now + 10) {
      throw new Error('Date.now() must return now + 10 because tick simulates 10ms had ellapsed')
  }
)
```

### process.uptime()

```javascript
import {mockExecution} from 'micmac'

mockExecution(
  ({tick}) => {
    const uptime = process.uptime()
    tick(1000)
    const afterTickUptime = process.uptime()
    if (afterTickUptime !== uptime + 1){
      throw new Error('process.uptime() must return uptime + 1 because tick(1000) simulates that 1s had ellapsed')
    }
  }
)
```

### process.hrtime()

```javascript
import {mockExecution} from 'micmac'

mockExecution(
  ({tick}) => {
    const [beforeTickSeconds, beforeTickNanoseconds] = process.hrtime()
    tick(1000, 100)
    const [afterTickSeconds, afterTickNanoseconds] = process.hrtime()
    if (afterTickSeconds !== beforeTickSeconds + 1) {
      throw new Error('process.hrtime()[0] must return beforeTickSeconds + 1 because tick(1000, 100) simulates that 1s had ellapsed')
    }
    if (afterTickNanoseconds !== beforeTickNanoseconds + 100) {
      throw new Error('process.hrtime()[1] must return beforeTickNanoseconds + 100 because tick(1000, 100) simulates that 100ns had ellapsed')
    }
  }
)
```

