import {
  expectFunction,
  expectMatch,
  expectRejectWith,
  expectResolveWith,
  expectThrowWith,
  matchError,
  matchProperties,
  matchTypeError,
} from "@dmail/expect"
import { createTest } from "@dmail/test"
import { createFakePromise } from "./FakePromise.js"

const FakePromise = createFakePromise({
  microCallback: (fn) => setTimeout(fn),
})

export default createTest({
  "is a function": () => expectFunction(FakePromise),
  "toString()": () => expectMatch(new FakePromise(() => {}).toString(), "[object FakePromise]"),
  "throw when called without arg": () => expectThrowWith(FakePromise, matchError()),
  "throw a TypeError called with something !== than a function": () =>
    expectThrowWith(() => new FakePromise(true), matchTypeError()),
  "can resolve": () => expectResolveWith(new FakePromise((resolve) => resolve())),
  "FakePromise.resolve().then()": () => expectResolveWith(FakePromise.resolve().then(), undefined),
  "then() on pending promise": () => {
    let resolve
    const promise = new Promise((res) => {
      resolve = res
    })
    const error = new Error()
    const nextPromise = promise.then(() => {
      throw error
    })
    resolve()
    return expectRejectWith(nextPromise, error)
  },
  ".then(false)": () =>
    expectThrowWith(
      () => FakePromise.resolve().then(1),
      matchTypeError(
        matchProperties({
          message: `then first arg must be a function 1 given`,
        }),
      ),
    ),
  ".catch(false)": () =>
    expectThrowWith(
      () => FakePromise.resolve().catch(1),
      matchTypeError(
        matchProperties({
          message: `then second arg must be a function 1 given`,
        }),
      ),
    ),
  "resolving to itself": () => {
    let resolve
    const promise = new FakePromise((res) => {
      resolve = res
    })
    resolve(promise)
    return expectRejectWith(
      promise,
      matchTypeError(
        matchProperties({
          message: "A promise cannot be resolved with itself",
        }),
      ),
    )
  },
  "resolve unwrap resolved promise": () => {
    const expectedValue = 10
    const promise = FakePromise.resolve(FakePromise.resolve(expectedValue))
    return expectResolveWith(promise, expectedValue)
  },
  "resolve unwrap rejected promise": () =>
    expectRejectWith(FakePromise.resolve(FakePromise.reject())),
  "can reject": () => expectRejectWith(new FakePromise((resolve, reject) => reject())),
  "throw in executor creates a rejected promise": () => {
    const error = new Error()
    return expectRejectWith(
      new FakePromise(() => {
        throw error
      }),
      error,
    )
  },
  "throw while reading thenable.then creates a rejected promise": () => {
    const thenable = {}
    const exception = 1
    Object.defineProperty(thenable, "then", {
      get: () => {
        throw exception
      },
    })
    const promise = FakePromise.resolve(thenable)
    return expectRejectWith(promise, exception)
  },
  "throw while executing thenable.then creates a rejected promise": () => {
    const exception = 1
    const promise = FakePromise.resolve({
      then: () => {
        throw exception
      },
    })
    return expectRejectWith(promise, exception)
  },
  // cannot be tested yet because action unwrap promise
  // "reject does not unwrap resolved promise": () => {
  // 	const resolvedPromise = Promise.resolve()
  // 	const promise = FakePromise.reject(resolvedPromise)
  // 	return expectRejectWith(promise, resolvedPromise)
  // },
  "all with empty array": () => {
    const values = ["a", "b"]
    const promise = FakePromise.all(values)
    return expectResolveWith(promise, matchProperties(values))
  },
  "all with non thenable and thenable values": () => {
    const values = [0, FakePromise.resolve(1), 2, Promise.resolve(3)]
    const promise = FakePromise.all(values)
    return expectResolveWith(promise, matchProperties([0, 1, 2, 3]))
  },
  "all with a thenable getter throwing": () => {
    const error = new Error()
    const thenable = {}
    Object.defineProperty(thenable, "then", {
      get: () => {
        throw error
      },
    })
    return expectRejectWith(FakePromise.all([thenable]), error)
  },
  "race()": () => expectResolveWith(FakePromise.race([FakePromise.resolve(1)]), 1),
})
