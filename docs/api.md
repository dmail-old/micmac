Examples and explanation about the API, especially mockExecution

## mockExecution(fn)

mockExecution mock features on the global object and then calls fn.  
This way when fn gets called, global function like setTimeout are mocked.  
After fn gets called features are restored.

```javascript
import {mockExecution} from 'micmac'

const globalSetTimeout = setTimeout
mockExecution(
  () => {
    if (setTimeout === globaSetTimeout) {
      throw new Error('setTimeout should be mocked')
    }
  }
)
if (globalSetTimeout !== setTimeout) {
  throw new Error('setTimeout should be restored')
}
```

Please note that if fn throws, mockExecution restore features because it wraps fn call into `try/finally`.

### mockExecution examples

This section will show many example of how mockExecution is meant to be used.  
For the brievty of the examples some `toBeTested` function are declared inline. 
In your application you would import it from an external module that you want to test.  
The examples not declaring `toBeTested` function are here to show side effects on time related features.

### Promise (BEST FEATURE)

```javascript
import {mockExecution} from 'micmac'

const toBeTested = (a) => Promise.resolve(a + 1)

mockExecution(
  ({tick}) => {
    let value = 5
    let actualValue
    const expectedValue = value + 1
    toBeTested(value).then(() => { actualValue = a })
    if (actualValue !== undefined) throw new Error('promise.then should not be called synchronously')
    tick()
    if (actualValue == undefined) throw new Error('promise.then should be mocked')
    if (actualValue !== expectedValue) throw new Error(`value should be ${expectedValue}`)
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
    toBeTested(() => { called = true })
    if (called) throw new Error('should not be called')
    tick(10)
    if (!called) throw new Error('should be called')
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
    if (new Date().getTime() !== now + 10) throw new Error('new Date() should be mocked')
    if (Date.now() !== now + 10) throw new Error('Date.now() should be mocked')
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
    if (afterTickUptime !== uptime + 1) throw new Error('process.uptime() should be mocked')
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
    if (afterTickSeconds !== beforeTickSeconds + 1) throw new Error('process.hrtime()[0] should be mocked')
    if (afterTickNanoseconds !== beforeTickNanoseconds + 100) throw new Error('process.hrtime()[1] should be mocked')
  }
)
```

