// https://github.com/substack/node-mkdirp/issues/129

import {
  expectCalledOnceWith,
  expectCalledOnceWithoutArgument,
  expectCalledTwiceWithoutArgument,
  expectChain,
  expectMatch,
  expectNotCalled,
  matchNot,
  matchProperties,
} from "@dmail/expect"
import { createSpy } from "@dmail/spy"
import { createTest } from "@dmail/test"
import assert from "assert"
import { mockExecution } from "./micmac.js"

export default createTest({
  "getRealNow() with tick & tickAbsolute": () => {
    const RealDate = Date
    return mockExecution(({ getRealNow, tick, tickAbsolute }) =>
      expectChain(
        () => expectMatch(getRealNow(), RealDate.now()),
        () => tick(10),
        () => tick(2),
        () => expectMatch(getRealNow(), RealDate.now()),
        () => tickAbsolute(23),
        () => expectMatch(getRealNow(), RealDate.now()),
      ),
    )
  },
  "getFakeNow() with tick & tickAbsolute": () => {
    return mockExecution(({ getFakeNow, tick, tickAbsolute }) => {
      return expectChain(
        () => expectMatch(getFakeNow(), 0),
        () => tick(10),
        () => tick(2),
        () => expectMatch(getFakeNow(), 12),
        () => tickAbsolute(23),
        () => expectMatch(getFakeNow(), 23),
      )
    })
  },
  "Date.now() with tick, tickAbsolute": () => {
    return mockExecution(({ tick, tickAbsolute }) =>
      expectChain(
        () => expectMatch(Date.now(), 0),
        () => tick(10),
        () => tick(2),
        () => expectMatch(Date.now(), 12),
        () => tickAbsolute(5),
        () => expectMatch(Date.now(), 5),
      ),
    )
  },
  "new Date().getTime() with tick, tickAbsolute": () => {
    return mockExecution(({ tick, tickAbsolute }) =>
      expectChain(
        () => expectMatch(new Date().getTime(), 0),
        () => tick(10),
        () => tick(2),
        () => expectMatch(new Date().getTime(), 12),
        () => tickAbsolute(5),
        () => expectMatch(new Date().getTime(), 5),
      ),
    )
  },
  "new Date('1 January 1970 00:00:00 UTC').getTime() with tick, tickAbsolute": () => {
    return mockExecution(({ tick, tickAbsolute }) =>
      expectChain(
        () => expectMatch(new Date("1 January 1970 00:00:00 UTC").getTime(), 0),
        () => tick(10),
        () => tick(2),
        () => expectMatch(new Date("1 January 1970 00:00:00 UTC").getTime(), 0),
        () => tickAbsolute(5),
        () => expectMatch(new Date("1 January 1970 00:00:00 UTC").getTime(), 0),
      ),
    )
  },
  "mockExecution temp overrides global Date constructor": () => {
    const globalDate = Date
    return expectChain(
      () => mockExecution(() => expectMatch(globalDate, matchNot(Date))),
      () => expectMatch(globalDate, Date),
    )
  },
  "FakeDate.now valid once uninstalled": () => {
    return expectMatch(mockExecution(() => Date).now(), Date.now())
  },
  "process.uptime()": () => {
    return mockExecution(({ tick }) => {
      tick(10)
      return expectMatch(process.uptime(), 0.01)
    })
  },
  "getRealuptime()": () => {
    const getUptime = process.uptime
    return mockExecution(({ getRealUptime, tick, tickAbsolute }) =>
      expectChain(
        () => expectMatch(getRealUptime(), getUptime()),
        () => tick(10),
        () => tick(2),
        () => expectMatch(getRealUptime(), getUptime()),
        () => tickAbsolute(23),
        () => expectMatch(getRealUptime(), getUptime()),
      ),
    )
  },
  "process.hrtime()": () => {
    return mockExecution(({ tick }) =>
      expectChain(
        () => expectMatch(process.hrtime(), matchProperties([0, 0])),
        () => tick(10, 20),
        () => expectMatch(process.hrtime(), matchProperties([0.01, 20])),
        () => expectMatch(process.hrtime([0.002, 12]), matchProperties([0.008, 8])),
      ),
    )
  },
  "getRealHrtime()": () => {
    const getHrtime = process.hrtime
    return mockExecution(({ getRealHrtime }) => expectMatch(getRealHrtime()[0], getHrtime()[0]))
  },
  "process.nextTick()": () => {
    return mockExecution(({ micro }) => {
      const spy = createSpy()
      const args = [0, 1]
      process.nextTick(spy, ...args)
      return expectChain(
        () => expectNotCalled(spy),
        () => micro(),
        () => expectCalledOnceWith(spy, ...args),
      )
    })
  },
  "process.nextTick() nested are immediatly called in order": () => {
    mockExecution(({ micro }) => {
      const calls = []

      process.nextTick(() => {
        calls.push("a")
        process.nextTick(() => {
          calls.push("c")
        })
      })
      process.nextTick(() => {
        calls.push("b")
      })

      micro()
      assert.equal(calls.join(), "a,b,c")
    })
    return expectMatch(1, 1)
  },
  "setImmediate()": () => {
    return mockExecution(({ macro }) => {
      const spy = createSpy()
      setImmediate(spy)
      return expectChain(
        () => expectNotCalled(spy),
        () => macro(),
        () => expectCalledOnceWithoutArgument(spy),
      )
    })
  },
  "setImmediate nested awaits next macro call": () => {
    mockExecution(({ macro }) => {
      let called = false
      let nestedCall = false
      setImmediate(() => {
        called = true
        setImmediate(() => {
          nestedCall = true
        })
      })
      assert.equal(called, false)
      macro()
      assert.equal(called, true)
      assert.equal(nestedCall, false)
      macro()
      assert.equal(nestedCall, true)
    })
    return expectMatch(1, 1)
  },
  "clearImmediate()": () => {
    return mockExecution(({ macro }) => {
      const spy = createSpy()
      const id = setImmediate(spy)

      return expectChain(
        () => expectMatch(clearImmediate("foo"), undefined),
        () => {
          clearImmediate(id)
          macro()
        },
        () => expectNotCalled(spy),
      )
    })
  },
  "setTimeout function can be trigged using tick": () => {
    return mockExecution(({ tick }) => {
      const spy = createSpy()
      setTimeout(spy)
      return expectChain(
        () => expectNotCalled(spy),
        () => tick(),
        () => expectCalledOnceWithoutArgument(spy),
      )
    })
  },
  "setTimeout + tick in the future does call": () => {
    mockExecution(({ tick }) => {
      let called = false
      setTimeout(() => {
        called = true
      }, 10)
      tick(20)
      assert.equal(called, true)
    })
    return expectMatch(1, 1)
  },
  "clearTimeout cancels a timeout": () => {
    return mockExecution(({ tick }) => {
      const spy = createSpy()
      const id = setTimeout(spy)
      return expectChain(
        () => expectMatch(clearTimeout("foo"), undefined),
        () => {
          clearTimeout(id)
          tick()
        },
        () => expectNotCalled(spy),
      )
    })
  },
  "setInterval() with 10": () => {
    return mockExecution(({ tick }) => {
      const spy = createSpy()
      setInterval(spy, 10)
      return expectChain(
        () => expectNotCalled(spy),
        () => tick(10),
        () => expectCalledOnceWithoutArgument(spy),
        () => tick(10),
        () => expectCalledTwiceWithoutArgument(spy),
      )
    })
  },
  "setInterval with 0": () => {
    mockExecution(({ macro }) => {
      let callCount = 0
      setInterval(() => {
        callCount++
      })
      assert.equal(callCount, 0)
      macro()
      assert.equal(callCount, 1)
      macro()
      assert.equal(callCount, 2)
    })
    return expectMatch(1, 1)
  },
  "setInterval best effort on interval ms": () => {
    mockExecution(({ tick }) => {
      let callCount = 0
      setInterval(() => {
        callCount++
      }, 10)

      assert.equal(callCount, 0)
      tick(33)
      assert.equal(callCount, 1)
      tick(6)
      assert.equal(callCount, 1)
      tick(1)
      assert.equal(callCount, 2)
    })
    return expectMatch(1, 1)
  },
  "clearInterval called inside callback prevent next execution": () => {
    mockExecution(({ tick }) => {
      let callCount = 0
      const id = setInterval(() => {
        callCount++
        clearInterval(id)
      })
      assert.equal(callCount, 0)
      tick()
      assert.equal(callCount, 1)
      tick()
      assert.equal(callCount, 1)
    })
    return expectMatch(1, 1)
  },
  "clearInterval called outside callback prevent next execution": () => {
    mockExecution(({ tick }) => {
      let callCount = 0
      const id = setInterval(() => {
        callCount++
      })
      assert.equal(callCount, 0)
      tick()
      assert.equal(callCount, 1)
      clearInterval(id)
      tick()
      assert.equal(callCount, 1)
    })
    return expectMatch(1, 1)
  },
  "clearInterval()": () => {
    return mockExecution(({ tick }) => {
      const spy = createSpy()
      const id = setInterval(spy, 10)
      return expectChain(
        () => expectNotCalled(spy),
        () => tick(10),
        () => expectCalledOnceWithoutArgument(spy),
        () => expectMatch(clearInterval("foo"), undefined),
        () => {
          clearInterval(id)
          tick(10)
        },
        () => expectCalledOnceWithoutArgument(spy),
      )
    })
  },
  "calling micro calls promise onFullfill": () => {
    return mockExecution(({ micro }) => {
      const spy = createSpy()
      Promise.resolve().then(spy)
      return expectChain(
        () => expectNotCalled(spy),
        () => micro(),
        () => expectCalledOnceWith(spy, undefined),
      )
    })
  },
  "example with time dependent nested promise": () => {
    return mockExecution(({ tick }) => {
      const createPromiseResolvedIn = (ms, value) =>
        new Promise((resolve) => setTimeout(resolve, ms, value))
      const nestedPromise = createPromiseResolvedIn(10)
      const innerPromise = new Promise((resolve) => resolve(nestedPromise))
      const outerPromise = createPromiseResolvedIn(20, innerPromise)

      const expectPending = (...args) =>
        expectChain(...args.map((arg) => () => expectMatch(arg.status, "pending")))
      const expectFulfilled = (...args) =>
        expectChain(...args.map((arg) => () => expectMatch(arg.status, "fulfilled")))
      const expectResolved = (...args) =>
        expectChain(...args.map((arg) => () => expectMatch(arg.status, "resolved")))

      return expectChain(
        () => expectPending(nestedPromise, outerPromise),
        () => expectResolved(innerPromise),
        () => tick(10),
        () => expectFulfilled(nestedPromise, innerPromise),
        () => expectPending(outerPromise),
        () => tick(20),
        () => expectFulfilled(nestedPromise, innerPromise, outerPromise),
      )
    })
  },
})
