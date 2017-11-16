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
	let absoluteNano = createNano()
	let currentNano = absoluteNano
	const changeNano = nano => {
		if (currentNano.compare(nano)) {
			currentNano = nano
			emitNanoChanged()
		}
	}
	const tick = (ellapsedMilliseconds, ellapsedNanoseconds) => {
		if (ellapsedMilliseconds || ellapsedNanoseconds) {
			changeNano(currentNano.plus(createNano(ellapsedMilliseconds, ellapsedNanoseconds)))
		}
		macro()
	}
	const tickAbsolute = (milliseconds, nanoseconds) => {
		changeNano(createNano(milliseconds, nanoseconds))
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
		tickAbsolute
	}
}
