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
  "setImmediate()": () => {
    return mockExecution(({ micro }) => {
      const spy = createSpy()
      setImmediate(spy)
      return expectChain(
        () => expectNotCalled(spy),
        () => micro(),
        () => expectCalledOnceWithoutArgument(spy),
      )
    })
  },
  "clearImmediate()": () => {
    return mockExecution(({ micro }) => {
      const spy = createSpy()
      const id = setImmediate(spy)

      return expectChain(
        () => expectMatch(clearImmediate("foo"), undefined),
        () => {
          clearImmediate(id)
          micro()
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
  "setInterval()": () => {
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

// NOTE: ensure what I wanted to test in the tests below
// is covered here
/*
"registerCallback registers a function called when macro is called": () => {
    const { macro, listenMacro, getNano } = createExecutionController()
    const { macroCallback } = createExecutionHooks({ listenMacro, getNano })
    const spy = createSpy()

    macroCallback(spy)
    return expectChain(
      () => expectNotCalled(spy),
      () => macro(),
      () => expectCalledOnceWithoutArgument(spy),
      () => macro(),
      // ensure it's removed after being called
      () => expectCalledOnceWithoutArgument(spy),
    )
  },
  "macroCallback called during execution registered on next macro": () => {
    const { macro, listenMacro, getNano } = createExecutionController()
    const { macroCallback } = createExecutionHooks({ listenMacro, getNano })
    const spy = createSpy(() => macroCallback(spy))

    macroCallback(spy)
    return expectChain(
      () => expectNotCalled(spy),
      () => macro(),
      () => expectCalledOnceWithoutArgument(spy),
      () => macro(),
      () => expectCalledTwiceWithoutArgument(spy),
    )
  },
  "macroCallback returns a function cancelling registration": () => {
    const { macro, listenMacro, getNano } = createExecutionController()
    const { macroCallback } = createExecutionHooks({ listenMacro, getNano })
    const spy = createSpy()

    const cancel = macroCallback(spy)
    cancel()
    macro()
    return expectNotCalled(spy)
  },
  "setMicro registers a function called when micro is called": () => {
    const { micro, listenMicro, getNano } = createExecutionController()
    const { setMicro } = createExecutionHooks({ listenMicro, getNano })
    const spy = createSpy()

    return expectChain(
      () => setMicro(spy),
      () => expectNotCalled(spy),
      () => micro(),
      () => expectCalledOnceWithoutArgument(spy),
    )
  },
  "microCallback called during execution are executed at the end of current micros": () => {
    const { micro, listenMicro, getNano } = createExecutionController()
    const { microCallback } = createExecutionHooks({ listenMicro, getNano })
    const secondSpy = createSpy()
    const thirdSpy = createSpy()
    const firstSpy = createSpy(() => microCallback(thirdSpy))

    microCallback(firstSpy)
    microCallback(secondSpy)
    micro()
    return expectCalledInOrder(firstSpy, secondSpy, thirdSpy)
  },
  "microCallback forward args": () => {
    const { micro, listenMicro, getNano } = createExecutionController()
    const { microCallback } = createExecutionHooks({ listenMicro, getNano })
    const spy = createSpy()
    const args = [0, 1]
    microCallback(spy, ...args)
    micro()
    return expectCalledOnceWith(spy, ...args)
  },
  "micros auto called after macros": () => {
    const { listenMicro, macro, listenMacro, getNano } = createExecutionController()
    const { microCallback, macroCallback } = createExecutionHooks({
      listenMicro,
      listenMacro,
      getNano,
    })
    const microSpy = createSpy()
    const macroSpy = createSpy()

    microCallback(microSpy)
    macroCallback(macroSpy)
    macro()
    return expectCalledInOrder(macroSpy, microSpy)
  },
  "macroCallbackForElapsedMs immediatly calls when delayed by zero": () => {
    const { tick, listenMacro, getNano } = createExecutionController()
    const { macroCallbackForElapsedMs } = createExecutionHooks({ listenMacro, getNano })
    const spy = createSpy()

    macroCallbackForElapsedMs(spy)
    return expectChain(
      () => expectNotCalled(spy),
      () => tick(),
      () => expectCalledOnceWithoutArgument(spy),
    )
  },
  "ensure late delayed function are called": () => {
    const { tick, listenMacro, getNano } = createExecutionController()
    const { macroCallbackForElapsedMs } = createExecutionHooks({ listenMacro, getNano })
    const spy = createSpy()

    macroCallbackForElapsedMs(spy, 10)
    tick(20)
    return expectCalledOnceWithoutArgument(spy)
  },
  "can cancel delayed function": () => {
    const { tick, listenMacro, getNano } = createExecutionController()
    const { macroCallbackForElapsedMs } = createExecutionHooks({ listenMacro, getNano })
    const spy = createSpy()
    const cancel = macroCallbackForElapsedMs(spy)
    cancel()
    tick()
    return expectNotCalled(spy)
  },
  "macroCallbackForElapsedMsRecursive auto delay same function in next ideal delayed ms": () => {
    const { tick, listenMacro, getNano } = createExecutionController()
    const { macroCallbackForElapsedMsRecursive } = createExecutionHooks({ listenMacro, getNano })
    const spy = createSpy()
    macroCallbackForElapsedMsRecursive(spy)

    return expectChain(
      () => expectNotCalled(spy),
      () => tick(),
      () => expectCalledOnceWithoutArgument(spy),
      () => tick(),
      () => expectCalledTwiceWithoutArgument(spy),
    )
  },
  "macroCallbackForElapsedMsRecursive forward args": () => {
    const { macro, listenMacro, getNano } = createExecutionController()
    const { macroCallbackForElapsedMsRecursive } = createExecutionHooks({ listenMacro, getNano })
    const spy = createSpy()
    const args = [0, 1]
    macroCallbackForElapsedMsRecursive(spy, 0, ...args)

    return expectChain(
      () => expectNotCalled(spy),
      () => macro(),
      () => expectCalledOnceWith(spy, ...args),
    )
  },
  "macroCallbackForElapsedMsRecursive tries to respect intervalMs": () => {
    const { tick, listenMacro, getNano } = createExecutionController()
    const { macroCallbackForElapsedMsRecursive } = createExecutionHooks({ listenMacro, getNano })
    const spy = createSpy()
    macroCallbackForElapsedMsRecursive(spy, 10)

    return expectChain(
      () => expectNotCalled(spy),
      () => tick(33),
      () => expectCalledOnceWithoutArgument(spy),
      () => tick(6),
      () => expectCalledOnceWithoutArgument(spy),
      () => tick(1),
      () => expectCalledTwiceWithoutArgument(spy),
    )
  },
  "macroCallbackForElapsedMsRecursive cancelled inside function prevent recursive delay": () => {
    const { tick, listenMacro, getNano } = createExecutionController()
    const { macroCallbackForElapsedMsRecursive } = createExecutionHooks({ listenMacro, getNano })
    let cancel
    const spy = createSpy(() => {
      cancel()
    })
    cancel = macroCallbackForElapsedMsRecursive(spy)
    return expectChain(
      () => expectNotCalled(spy),
      () => tick(),
      () => expectCalledOnceWithoutArgument(spy),
      () => tick(),
      () => expectCalledOnceWithoutArgument(spy),
    )
  },
  "macroCallbackForElapsedMsRecursive cancelled outside before next tick prevent recursive": () => {
    const { tick, listenMacro, getNano } = createExecutionController()
    const { macroCallbackForElapsedMsRecursive } = createExecutionHooks({ listenMacro, getNano })
    const spy = createSpy()
    const cancel = macroCallbackForElapsedMsRecursive(spy)

    tick()
    return expectChain(
      () => expectCalledOnceWithoutArgument(spy),
      () => {
        cancel()
        tick()
      },
      () => expectCalledOnceWithoutArgument(spy),
    )
  },
*/
