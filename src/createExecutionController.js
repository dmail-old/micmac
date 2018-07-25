import { createSignal } from "@dmail/signal"
import { createNano } from "./nano.js"

const createReactionManager = () => {
  const callbacks = []

  const registerVolatileReaction = ({ condition, action }) => {
    let status = "pending"

    const callback = () => {
      if (condition && !condition()) {
        return
      }
      status = "running"
      // eslint-disable-next-line no-use-before-define
      remove(callback)
      action()
      status = "runned"
    }

    callbacks.push(callback)

    const remove = () => {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }

    return {
      isPending: () => status === "pending",
      isCancelled: () => status === "cancelled",
      isCancellable: () => status !== "cancelled",
      cancel: () => {
        if (status === "cancelled") {
          throw new Error(`reaction.cancel called but reaction is already cancelled`)
        }
        if (status === "pending") {
          remove()
        }
        status = "cancelled"
      },
    }
  }

  return {
    callbacks,
    registerVolatileReaction,
  }
}

const createMicroVolatileReaction = ({ listenMicro }) => {
  const { registerVolatileReaction, callbacks } = createReactionManager()

  listenMicro(() => {
    // Any microtask added during a microtask execution is added to callbacks array
    // so after executing all micros the elements added to micros will also be called.
    let i = 0
    while (i < callbacks.length) {
      const callback = callbacks[0]
      callback()

      // if the micro still in micros, we have to increment to get the next one
      // right now this is not possible because micro are always removed from callbacks
      // it would happen if we could add conditional reaction as for macro above
      if (callbacks.includes(callback)) {
        i++
      }
    }
  })

  return registerVolatileReaction
}

const createMacroVolatileReaction = ({ listenMacro }) => {
  const { registerVolatileReaction, callbacks } = createReactionManager()

  listenMacro(() => {
    // callbacks.slice() is to prevent iterating over tasks added during the loop below
    // may happen if fn(...args) calls registerCallbackForElapsedMs(() => {}, 0)
    // also avoid having to track i when mutating callbacks array
    const localCallbacks = callbacks.slice()
    let i = 0
    while (i < localCallbacks.length) {
      const callback = localCallbacks[i]
      callback()
      i++
    }
  })

  return registerVolatileReaction
}

export const createExecutionController = () => {
  const { listen: listenMicro, emit: emitMicro } = createSignal()

  const micro = (count = 1) => {
    while (count > 0) {
      emitMicro()
      count--
    }
  }

  const microVolatileReaction = createMicroVolatileReaction({ listenMicro })

  const { listen: listenMacro, emit: emitMacro } = createSignal()

  const macro = (count = 1) => {
    while (count > 0) {
      emitMacro()
      micro()
      count--
    }
  }

  const macroVolatileReaction = createMacroVolatileReaction({ listenMacro })

  const { listen: listenNano, emit: emitNanoChanged } = createSignal()

  const absoluteNano = createNano()

  let currentNano = absoluteNano

  const getNano = () => currentNano

  const changeNano = (nano) => {
    if (currentNano.compare(nano)) {
      currentNano = nano
      emitNanoChanged()
    }
  }

  const elapse = (millisecond, nanosecond) => {
    changeNano(
      currentNano.plus(
        createNano({
          millisecond,
          nanosecond,
        }),
      ),
    )
  }

  const elapseAbsolute = (millisecond, nanosecond) => {
    changeNano(
      createNano({
        millisecond,
        nanosecond,
      }),
    )
  }

  const tick = (millisecond, nanosecond) => {
    if (millisecond || nanosecond) {
      elapse(millisecond, nanosecond)
    }
    macro()
  }

  const tickAbsolute = (millisecond, nanosecond) => {
    if (millisecond || nanosecond) {
      elapseAbsolute(millisecond, nanosecond)
    }
    macro()
  }

  return {
    // micro methods
    listenMicro,
    microVolatileReaction,
    micro,
    // macro methods
    listenMacro,
    macroVolatileReaction,
    macro,
    // time methods
    listenNano,
    getNano,
    elapse,
    elapseAbsolute,
    // use a mix of everything methods
    tick,
    tickAbsolute,
  }
}
