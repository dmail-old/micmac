// https://github.com/jasmine/jasmine/blob/9cb2f06aa665870dbd5df5fd58a35863738961b3/src/core/Clock.js
// https://gist.github.com/kevinoid/3146420
// https://github.com/jasmine/jasmine/blob/9cb2f06aa665870dbd5df5fd58a35863738961b3/src/core/DelayedFunctionScheduler.js
// https://github.com/jasmine/jasmine/blob/9cb2f06aa665870dbd5df5fd58a35863738961b3/src/core/Clock.js
// http://voidcanvas.com/setimmediate-vs-nexttick-vs-settimeout/
// https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/

import { createPropertyMethods } from "../util/index.js"
import { createExecutionController } from "./createExecutionController.js"
import { createExecutionHooks } from "./createExecutionHooks.js"
import { createFakePromise } from "./FakePromise.js"
import { createNano, createNanoFromSeconds, convertSecondsToMilliseconds } from "./nano.js"

const composeFunction = (a, b) => (...args) => {
	a(...args)
	b(...args)
}
const composeFunctionAndReturnedFunctions = (...fns) => (...args) => {
	const returnedFns = fns.map(fn => fn(...args))
	return () => {
		returnedFns.forEach(returnedFn => returnedFn())
	}
}
const createFakeInstaller = installer => {
	let installed = false

	return ({ object, executionController }) => {
		if (installed) {
			throw new Error("fakeTimerHooks already installed")
		}
		installed = true
		let restore = () => {
			installed = false
		}
		const addRestorer = fn => {
			restore = composeFunction(restore, fn)
		}
		const mock = (instruction, where) => {
			const { fake, set, get } = instruction

			addRestorer(where.set(where.name, fake))
			if (get) {
				const initialNano = get()
				let nano = initialNano
				executionController.listenMicro(fakeNano => {
					nano = nano.add(fakeNano)
					set(nano)
				})
				addRestorer(() => set(initialNano))
			}
		}
		const getHowParams = where => where.get(where.name)
		const override = (where, how) => {
			if (where === null) {
				return
			}
			const instruction = how(getHowParams(where))
			mock(instruction, where)
		}
		const composeOverride = (...args) => {
			const how = args.pop()
			const wheres = args

			if (wheres.some(where => where === null)) {
				return
			}
			const instructions = how(...wheres.map(where => getHowParams(where)))
			wheres.forEach((where, index) => mock(instructions[index], where))
		}
		const at = (...names) => {
			if (names.length === 0) {
				throw new Error("one name expected")
			}
			let i = 0
			let { has, get, set } = createPropertyMethods(object)
			let name
			while (i < names.length) {
				name = names[i]
				if (has(name) === false) {
					return null
				} else if (i === names.length - 1) {
					break
				}
				;({ has, get, set } = createPropertyMethods(get(name)))
				i++
			}
			return {
				has,
				get,
				set,
				name
			}
		}
		installer({
			at,
			override,
			composeOverride,
			executionController
		})
		return restore
	}
}
const createSetCancelPairs = fnReturningCancel => {
	let previousId = 0
	const cancellerIds = {}

	const set = (...args) => {
		const id = previousId + 1
		previousId = id
		cancellerIds[id] = fnReturningCancel(...args)
		return id
	}
	const cancel = id => {
		if (id in cancellerIds) {
			cancellerIds[id]()
			delete cancellerIds[id]
		}
	}
	return { set, cancel }
}

export const installFakeDate = createFakeInstaller(({ at, override }) =>
	override(at("Date"), RealDate => {
		let nano = createNano(RealDate.now())
		function FakeDate(...args) {
			// eslint-disable-line no-inner-declarations
			if (args.length === 0) {
				return new RealDate(nano.toMilliseconds())
			}
			return new RealDate(...args)
		}
		// ideally once uninstalled fakeDate.now should return RealDate.now
		const fakeNow = () => nano.toMilliseconds()
		const overrides = {
			now: fakeNow
		}
		Object.getOwnPropertyNames(RealDate).forEach(name => {
			const descriptor = Object.getOwnPropertyDescriptor(RealDate, name)
			if (descriptor.configurable) {
				if (name in overrides) {
					descriptor.value = overrides[name]
				}
				Object.defineProperty(FakeDate, name, descriptor)
			}
		})

		return {
			get: () => nano,
			set: fakeNano => {
				nano = fakeNano
			},
			fake: FakeDate
		}
	})
)
export const installFakeImmediate = createFakeInstaller(
	({ at, composeOverride, executionController }) =>
		composeOverride(at("setImmediate"), at("clearImmediate"), () => {
			const { setMicro } = createExecutionHooks(executionController)

			const immediateCancellerIds = {}
			let previousImmediateId = 0

			const fakeSetImmediate = (...args) => {
				const immediateId = previousImmediateId + 1
				previousImmediateId = immediateId
				immediateCancellerIds[immediateId] = setMicro(...args)
				return immediateId
			}
			const fakeClearImmediate = immediateId => {
				if (immediateId in immediateCancellerIds) {
					immediateCancellerIds[immediateId]()
					delete immediateCancellerIds[immediateId]
				}
			}
			return [
				{
					fake: fakeSetImmediate
				},
				{
					fake: fakeClearImmediate
				}
			]
		})
)
// the purpose of installing fake promise is that our fakePromise will rely on setImmediate
// when chaining thenable, if setImmediate was mocked as well
// we are now in a situation where we can control promise execution
// https://github.com/charleshansen/mock-promises
export const installFakePromise = createFakeInstaller(({ at, override }) =>
	override(at("Promise"), () => {
		return {
			fake: createFakePromise()
		}
	})
)
export const installFakeTimeout = createFakeInstaller(
	({ at, composeOverride, executionController }) =>
		composeOverride(at("setTimeout"), at("clearTimeout"), () => {
			const { delay } = createExecutionHooks(executionController)
			const { set: fakeSetTimeout, cancel: fakeClearTimeout } = createSetCancelPairs(delay)
			return [
				{
					fake: fakeSetTimeout
				},
				{
					fake: fakeClearTimeout
				}
			]
		})
)
export const installFakeInterval = createFakeInstaller(
	({ at, composeOverride, executionController }) =>
		composeOverride(at("setInterval"), at("clearInterval"), () => {
			const { delayRecursive } = createExecutionHooks(executionController)
			const { set: fakeSetInterval, cancel: fakeClearInterval } = createSetCancelPairs(
				delayRecursive
			)
			return [
				{
					fake: fakeSetInterval
				},
				{
					fake: fakeClearInterval
				}
			]
		})
)
export const installFakeProcessNextTick = createFakeInstaller(
	({ at, override, executionController }) =>
		override(at("process", "nextTick"), () => {
			const { setMicro } = createExecutionHooks(executionController)
			const fakeProcessNextTick = (fn, ...args) => {
				setMicro(fn, ...args)
			}
			return {
				fake: fakeProcessNextTick
			}
		})
)
export const installFakeProcessUptime = createFakeInstaller(({ at, override }) =>
	override(at("process", "uptime"), processUptime => {
		let nano = createNanoFromSeconds(processUptime())
		const fakeUptime = () => nano.toSecondsFloat()
		return {
			get: () => nano,
			set: fakeNano => {
				nano = fakeNano
			},
			fake: fakeUptime
		}
	})
)
export const installFakeProcessHrtime = createFakeInstaller(({ at, override }) =>
	override(at("process", "hrtime"), processHrtime => {
		const createNanoFromSecondsAndNanoseconds = ([seconds, nanoseconds]) =>
			createNano(convertSecondsToMilliseconds(seconds), nanoseconds)
		let nano = createNanoFromSecondsAndNanoseconds(processHrtime())

		const fakeHrtime = time => {
			if (time) {
				const timeNano = createNanoFromSecondsAndNanoseconds(time)
				const diffNano = nano.substract(timeNano)
				return [diffNano.toSecondsFloat(), diffNano.getNanoseconds()]
			}
			return [nano.toSecondsFloat(), nano.getNanoseconds()]
		}
		return {
			get: () => nano,
			set: fakeNano => {
				nano = fakeNano
			},
			fake: fakeHrtime
		}
	})
)
export const installFakeAnimationFrame = createFakeInstaller(
	({ at, composeOverride, executionController }) =>
		composeOverride(at("requestAnimationFrame"), at("cancelAnimationFrame"), () => {
			const { delayRecursive } = createExecutionHooks(executionController)
			const {
				set: fakeRequestAnimationFrame,
				cancel: fakeCancelAnimationFrame
			} = createSetCancelPairs(fn => delayRecursive(fn, 60))
			return [
				{
					fake: fakeRequestAnimationFrame
				},
				{
					fake: fakeCancelAnimationFrame
				}
			]
		})
)
export const installFakePerformanceNow = createFakeInstaller(({ at, override }) =>
	override(at("performance", "now"), performanceNow => {
		let nano = createNano(performanceNow())
		const fakePerformanceNow = () => nano.toMillisecondsFloat().toFixed(4)
		return {
			get: () => nano,
			set: fakeNano => {
				nano = fakeNano
			},
			fake: fakePerformanceNow
		}
	})
)
const installFakeHooks = composeFunctionAndReturnedFunctions(
	installFakeDate,
	installFakePromise,
	installFakeImmediate,
	installFakeTimeout,
	installFakeInterval,
	installFakeProcessNextTick,
	installFakeProcessUptime,
	installFakeProcessHrtime,
	installFakeAnimationFrame,
	installFakePerformanceNow
)

/*x
note about helper below : do not try/catch fn(ticker) in order to be sure uninstall() gets called
because when fn throws your application is into an unexpected state, let your app crash
-> in fact I use try finally because it's very important to uninstall setTimeout and stuff like that
when fn() throws because nodejs will then call setTimeout before letting your app crash
*/
export const mockExecution = fn => {
	const executionController = createExecutionController()
	const uninstall = installFakeHooks({
		object: typeof window === "object" ? window : global,
		executionController
	})
	try {
		return fn(executionController)
	} finally {
		uninstall()
	}
}
