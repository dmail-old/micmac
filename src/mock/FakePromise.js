const platform = typeof window === "object" ? "browser" : "node"
const platformPolymorph = (platforms) => platforms[platform]
const triggerEvent = platformPolymorph({
  browser: (name, event) => {
    name = `on${name.toLowerCase()}`
    const listener = window[name]
    if (listener) {
      listener(event)
      return true
    }
    return false
  },
  node: (name, event) => {
    if (process.listeners(name).length) {
      process.emit(name, event)
      return true
    }
    return false
  },
})

const triggerUnhandled = (value, promise) => {
  if (triggerEvent("onunhandledRejection", { value, promise }) === false) {
    console.log(`possibly unhandled rejection ${value} for ${promise}`)
  }
}

const triggerHandled = (promise) => {
  triggerEvent("rejectionHandled", { promise })
}

const callThenable = (thenable, onFulfill, onReject) => {
  try {
    const then = thenable.then
    then.call(thenable, onFulfill, onReject)
  } catch (e) {
    onReject(e)
  }
}

const isThenable = (object) => {
  if (object) {
    return typeof object.then === "function"
  }
  return false
}

const once = (fn, ...curriedArgs) => {
  let called = false
  return (...args) => {
    if (called === false) {
      called = true
      return fn(...curriedArgs, ...args)
    }
  }
}

const noop = () => {}

export const createFakePromise = ({ microCallback }) => {
  const settlePromise = (promise) => {
    if (promise.status === "rejected" && promise.handled === false) {
      microCallback(() => {
        if (!promise.handled) {
          triggerUnhandled(promise.value, promise)
          promise.unhandledTriggered = true
        }
      })
    }

    const hasPendingList = promise.hasOwnProperty("pendingList")
    if (hasPendingList) {
      const pendingList = promise.pendingList
      let i = 0
      while (i < pendingList.length) {
        handle(promise, pendingList[i]) // eslint-disable-line no-use-before-define
        i++
      }
      // on peut "supprimer" pendingList
      pendingList.length = 0
    }
  }

  const rejectPromise = (promise, reason) => {
    promise.status = "rejected"
    promise.value = reason
    settlePromise(promise)
  }

  const resolvePromise = (promise, value) => {
    try {
      if (isThenable(value)) {
        if (value === promise) {
          throw new TypeError("A promise cannot be resolved with itself")
        } else if (value instanceof FakePromise) {
          promise.status = "resolved"
          promise.value = value
          callThenable(value, once(resolvePromise, promise), once(rejectPromise, promise))
        } else {
          callThenable(value, once(resolvePromise, promise), once(rejectPromise, promise))
        }
      } else {
        promise.status = "fulfilled"
        promise.value = value
        settlePromise(promise)
      }
    } catch (e) {
      rejectPromise(promise, e)
    }
  }

  const handle = (promise, handler) => {
    // on doit s'inscrire sur la bonne pendingList
    // on finis forcément par tomber sur un thenable en mode 'pending'
    while (promise.status === "resolved") {
      promise = promise.value
    }
    if (promise.unhandledTriggered) {
      triggerHandled(promise)
    }
    promise.handled = true

    if (promise.status === "pending") {
      if (promise.hasOwnProperty("pendingList")) {
        promise.pendingList.push(handler)
      } else {
        promise.pendingList = [handler]
      }
    } else {
      microCallback(() => {
        let isFulfilled = promise.status === "fulfilled"
        let value = promise.value
        const callback = isFulfilled ? handler.onFulfill : handler.onReject

        if (callback !== null) {
          try {
            value = callback(value)
            isFulfilled = true
          } catch (e) {
            isFulfilled = false
            value = e
          }
        }

        const handlerPromise = handler.promise
        if (isFulfilled) {
          resolvePromise(handlerPromise, value)
        } else {
          rejectPromise(handlerPromise, value)
        }
      })
    }
  }

  function FakePromise(executor) {
    if (arguments.length === 0) {
      throw new Error("missing executor function")
    }
    if (typeof executor !== "function") {
      throw new TypeError("function expected as executor")
    }

    const fakePromise = this
    fakePromise.status = "pending"

    if (executor !== noop) {
      try {
        executor(once(resolvePromise, fakePromise), once(rejectPromise, fakePromise))
      } catch (e) {
        rejectPromise(fakePromise, e)
      }
    }

    return fakePromise
  }

  FakePromise.prototype = {
    constructor: FakePromise,
    unhandledTriggered: false,
    handled: false,
    toString: () => "[object FakePromise]",
    then(onFulfill = null, onReject = null) {
      if (onFulfill !== null && typeof onFulfill !== "function") {
        throw new TypeError(`then first arg must be a function ${onFulfill} given`)
      }
      if (onReject !== null && typeof onReject !== "function") {
        throw new TypeError(`then second arg must be a function ${onReject} given`)
      }

      const promise = new this.constructor(noop)
      const handler = {
        promise,
        onFulfill,
        onReject,
      }
      handle(this, handler)
      return promise
    },
    catch(onReject) {
      return this.then(null, onReject)
    },
  }

  FakePromise.resolve = (value) => {
    if (value && value instanceof FakePromise && value.constructor === FakePromise) {
      return value
    }
    return new FakePromise((resolve) => resolve(value))
  }

  FakePromise.reject = (value) => new FakePromise((resolve, reject) => reject(value))

  FakePromise.all = (iterable) =>
    new FakePromise((resolve, reject) => {
      var callCount = 0
      var resolvedCount = 0
      const values = []
      const resolveOne = (value, index) => {
        try {
          if (isThenable(value)) {
            callThenable(value, (value) => resolveOne(value, index), reject)
          } else {
            values[index] = value
            resolvedCount++
            if (resolvedCount === callCount) {
              resolve(values)
            }
          }
        } catch (e) {
          reject(e)
        }
      }

      let index = 0
      for (const value of iterable) {
        resolveOne(value, index)
        callCount++
        index++
      }

      if (resolvedCount === callCount) {
        // ne peut se produire que si aucun valeur n'est thenable
        resolve(values)
      }
    })

  FakePromise.race = (iterable) =>
    new FakePromise((resolve, reject) => {
      for (const thenable of iterable) {
        thenable.then(resolve, reject)
      }
    })

  return FakePromise
}
