import { createSignal } from "@dmail/signal"
import { createNano } from "./nano.js"

const createFunctionWithPositiveMillisecondsAndNanosecondsSignature = fn => (
	milliseconds = 0,
	nanoseconds = 0
) => {
	if (typeof milliseconds !== "number") {
		throw new TypeError(`${fn.name} first arg must be milliseconds, got ${milliseconds}`)
	}
	if (milliseconds < 0) {
		throw new Error(`${fn.name} first arg must be positive milliseconds, got ${milliseconds}`)
	}
	if (typeof nanoseconds !== "number") {
		throw new TypeError(`${fn.name} second arg must be nanoseconds, got ${milliseconds}`)
	}
	if (nanoseconds < 0) {
		throw new Error(`${fn.name} first arg must be positive nanoseconds, got ${milliseconds}`)
	}
	return fn(milliseconds, nanoseconds)
}

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
			changeNano(currentNano.add(createNano(ellapsedMilliseconds, ellapsedNanoseconds)))
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
		tick: createFunctionWithPositiveMillisecondsAndNanosecondsSignature(tick),
		tickAbsolute: createFunctionWithPositiveMillisecondsAndNanosecondsSignature(tickAbsolute)
	}
}
