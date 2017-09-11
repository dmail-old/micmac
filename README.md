# micmac
Control JavaScript execution for testing time dependent or async code

## Introduction

Coming soon, source code not available for now.

## Example
```javascript
import {mockExecution} from 'micmac'

mocExecution(({tick}) => {
  let called = false
  setTimeout(() => {
    called = true
  }, 10)
  if (called) {
    throw new Error('should not be called')
  }
  tick(10)
  if (called === false) {
    throw new Error('should be called')
  }  
})
```
