import { createNano } from "./nano.js"

export const createExecutionHooks = ({ listenMacro, listenMicro, getNano }) => {
	const hooks = {}

	if (listenMacro) {
		const macros = []
		const addMacro = (fn, condition = () => true) => {
			const macro = {
				condition,
				fn
			}
			macros.push(macro)
			return macro
		}
		const removeMacro = macro => {
			const index = macros.indexOf(macro)
			if (index > -1) {
				macros.splice(index, 1)
			}
		}
		const runMacros = () => {
			// prevent iterating over tasks added during the loop below
			// may happen if fn(...args) calls delay(() => {}, 0)
			// also avoid having to track i when mutating tasks array
			const localMacros = macros.slice()
			let i = 0
			while (i < localMacros.length) {
				const macro = localMacros[i]
				if (macro.condition()) {
					removeMacro(macro)
					macro.fn()
				}
				i++
			}
		}
		const setMacro = (...args) => {
			const macro = addMacro(...args)
			return () => removeMacro(macro)
		}

		let nano = createNano()
		let ellapsedMs = 0
		const addDelayedMacro = (fn, ms, ...args) => {
			const addedMs = nano.toMilliseconds()
			return addMacro(() => fn(...args), () => nano.toMilliseconds() - addedMs >= ms)
		}
		const delay = (fn, msDelay = 0, ...args) => {
			const macro = addDelayedMacro(fn, msDelay, ...args)
			return () => removeMacro(macro)
		}
		const delayRecursive = (fn, msInterval = 0, ...args) => {
			let removedByReturnedHook = false
			let delayedMacro

			const addRecursiveDelayedMacro = ms =>
				addDelayedMacro(
					() => {
						fn(...args)
						if (removedByReturnedHook) {
							return
						}

						if (ellapsedMs > msInterval) {
							// si on est appelé à 23s au lieu de 10, on a skip un interval
							// c'est la tehon mais planifie un appel pour 30s
							const msExcess = ellapsedMs - msInterval
							const idealDelay = msInterval - msExcess % msInterval
							ms = idealDelay
						}
						delayedMacro = addRecursiveDelayedMacro(ms)
					},
					ms,
					...args
				)
			delayedMacro = addRecursiveDelayedMacro(msInterval)

			return () => {
				removedByReturnedHook = true
				removeMacro(delayedMacro)
			}
		}

		listenMacro(() => {
			const fakeNano = getNano()
			ellapsedMs = fakeNano.substract(nano).toMilliseconds()
			nano = fakeNano
			runMacros()
		})

		Object.assign(hooks, {
			setMacro: setMacro,
			delay, // could be called whenMsEllapsed(fn, ms)
			delayRecursive // could be called recursiveWhenMsEllapsed(fn, ms)
		})
	}

	if (listenMicro) {
		const micros = []
		const addMicro = (fn, condition = () => true) => {
			const micro = {
				condition,
				fn
			}
			micros.push(micro)
			return micro
		}
		const removeMicro = micro => {
			const index = micros.indexOf(micro)
			if (index > -1) {
				micros.splice(index, 1)
			}
		}
		const runMicros = () => {
			// any microtask added during a microtask is going to happen after the current microtasks
			// are handled
			let i = 0
			while (i < micros.length) {
				const micro = micros[i]
				if (micro.condition()) {
					removeMicro(micro)
					micro.fn()
				} else {
					i++
				}
			}
		}
		listenMicro(runMicros)

		const setMicro = (fn, ...args) => {
			const micro = addMicro(() => fn(...args))
			return () => removeMicro(micro)
		}

		Object.assign(hooks, {
			setMicro
		})
	}

	return hooks
}
