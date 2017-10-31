import { createSignal } from "@dmail/signal"
import { createNano } from "./nano.js"

export const createExecutionController = () => {
	let nano = createNano()
	const { listen: listenMacro, emit: emitMacro } = createSignal()
	const { listen: listenMicro, emit: emitMicro } = createSignal()

	const micro = (count = 1) => {
		while (count > 0) {
			emitMicro(nano)
			count--
		}
	}
	const macro = (count = 1) => {
		while (count > 0) {
			emitMacro(nano)
			micro()
			count--
		}
	}
	const tick = (ellapsedMs = 0, ellapsedNs = 0) => {
		if (ellapsedMs || ellapsedNs) {
			nano = nano.add(createNano(ellapsedMs, ellapsedNs))
		}
		macro()
	}
	const tickAbsolute = (nowMs = 0, nowNs = 0) => {
		nano = createNano(nowMs, nowNs)
		macro()
	}

	return {
		listenMacro,
		listenMicro,
		macro,
		micro,
		tick,
		tickAbsolute
	}
}
