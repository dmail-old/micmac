# micmac

[![npm](https://badge.fury.io/js/micmac.svg)](https://badge.fury.io/js/micmac)
[![build](https://travis-ci.org/dmail/micmac.svg?branch=master)](http://travis-ci.org/dmail/micmac)
[![codecov](https://codecov.io/gh/dmail/micmac/branch/master/graph/badge.svg)](https://codecov.io/gh/dmail/micmac)

Mock most native way to execute JavaScript asynchonously to trigger them manually for testing.

## Example

```javascript
import { mockExecution } from "micmac"

mockExecution(({ tick }) => {
	let called = false
	setTimeout(() => {
		called = true
	}, 10)
	if (called) {
		throw new Error("called must be false because 10ms are not ellapsed")
	}
	tick(10)
	if (called === false) {
		throw new Error("called must be true because tick(10) simulates that 10ms had ellapsed")
	}
})
```

Check the [API documentation](./docs/api.md)

## Install

`npm i micmac`
