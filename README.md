# micmac
[![npm](https://badge.fury.io/js/micmac.svg)](https://badge.fury.io/js/micmac)
[![build](https://travis-ci.org/dmail/micmac.svg)](http://travis-ci.org/dmail/micmac)
[![codecov](https://codecov.io/gh/dmail/micmac/branch/master/graph/badge.svg)](https://codecov.io/gh/dmail/micmac)

Control JavaScript execution for testing time dependent or async code

## Introduction

Coming soon, source code not available for now.

## Example
```javascript
import {mockExecution} from 'micmac'

mocExecution(({tick}) => {
  let called = false
  setTimeout(() => { called = true }, 10)
  if (called) {
    throw new Error('should not be called')
  }
  tick(10)
  if (called === false) {
    throw new Error('should be called')
  }
})
```

Check the [API documentation](./docs/api.md)

## Install

`npm i micmac`
