import { createSignal } from "@dmail/signal"
import { createNano } from "./nano.js"

export const createExecutionController = () => {
  const { listen: listenMacro, emit: emitMacro } = createSignal()
  const { listen: listenMicro, emit: emitMicro } = createSignal()
  const { listen: listenNano, emit: emitNanoChanged } = createSignal()

  const micro = (count = 1) => {
    while (count > 0) {
      emitMicro()
      count--
    }
  }
  const macro = (count = 1) => {
    while (count > 0) {
      emitMacro()
      micro()
      count--
    }
  }
  const absoluteNano = createNano()
  let currentNano = absoluteNano
  const changeNano = nano => {
    if (currentNano.compare(nano)) {
      currentNano = nano
      emitNanoChanged()
    }
  }
  const tick = (ellapsedMillisecond, ellapsedNanosecond) => {
    if (ellapsedMillisecond || ellapsedNanosecond) {
      changeNano(
        currentNano.plus(
          createNano({
            millisecond: ellapsedMillisecond,
            nanosecond: ellapsedNanosecond,
          }),
        ),
      )
    }
    macro()
  }
  const tickAbsolute = (millisecond, nanosecond) => {
    changeNano(
      createNano({
        millisecond,
        nanosecond,
      }),
    )
    macro()
  }
  const getNano = () => currentNano

  return {
    listenMacro,
    listenMicro,
    listenNano,
    macro,
    micro,
    getNano,
    tick,
    tickAbsolute,
  }
}
