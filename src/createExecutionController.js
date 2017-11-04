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
	let nanoReference = absoluteNano
	let currentNano = absoluteNano
	const changeNano = nano => {
		currentNano = nano
		emitNanoChanged()
	}
	const setNanoReference = nano => {
		nanoReference = nano
		changeNano(nano)
	}
	const setTimeReference = (ms, ns) => setNanoReference(createNano(ms, ns))
	const tick = (ellapsedMs = 0, ellapsedNs = 0) => {
		if (ellapsedMs || ellapsedNs) {
			changeNano(currentNano.add(createNano(ellapsedMs, ellapsedNs)))
		}
		macro()
	}
	const tickRelative = (nowMs = 0, nowNs = 0) => {
		changeNano(nanoReference.add(createNano(nowMs, nowNs)))
		macro()
	}
	const getNano = () => currentNano

	return {
		listenMacro,
		listenMicro,
		listenNano,
		macro,
		micro,
		setNanoReference,
		setTimeReference,
		getNano,
		tick,
		tickRelative
	}
}
