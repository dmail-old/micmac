// https://github.com/jasmine/jasmine/blob/9cb2f06aa665870dbd5df5fd58a35863738961b3/src/core/Clock.js
// https://gist.github.com/kevinoid/3146420
// https://github.com/jasmine/jasmine/blob/9cb2f06aa665870dbd5df5fd58a35863738961b3/src/core/DelayedFunctionScheduler.js
// https://github.com/jasmine/jasmine/blob/9cb2f06aa665870dbd5df5fd58a35863738961b3/src/core/Clock.js
// http://voidcanvas.com/setimmediate-vs-nexttick-vs-settimeout/
// https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/

import { createExecutionController } from "./createExecutionController.js"
import { createExecutionHooks } from "./createExecutionHooks.js"
import { createFakePromise } from "./FakePromise.js"
import { createNano, convertSecondsToMilliseconds } from "./nano.js"
import {
	createFakeInstaller,
	createSetCancelPairs,
	composeFunctionAndReturnedFunctions
} from "./helpers.js"

const syncNano = (nano, previousNano, currentNano) => {
	if (previousNano.lowerThan(currentNano)) {
		return nano.plus(currentNano.minus(previousNano))
	}
	return nano.minus(previousNano.minus(currentNano))
}

const installFakeDate = createFakeInstaller(({ at, override, executionController, installed }) =>
	override(at("Date"), RealDate => {
		let fakeNano = createNano()
		const getRealNow = () => RealDate.now()
		// 0.00001% chance this feature to be used someday:
		// once uninstalled fakeNow returns RealDate.now so that it remains valid
		const getFakeNow = () => (installed.isOn() ? fakeNano.getMilliseconds() : getRealNow())
		// ideally once uninstalled fakeDate.now should return RealDate.now
		function FakeDate(...args) {
			// eslint-disable-line no-inner-declarations
			if (args.length === 0) {
				return new RealDate(getFakeNow())
			}
			return new RealDate(...args)
		}
		const overrides = {
			now: getFakeNow
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

		Object.assign(executionController, {
			getRealNow,
			getFakeNow
		})

		return {
			changed: (previousNano, nano) => {
				fakeNano = syncNano(fakeNano, previousNano, nano)
			},
			fake: FakeDate
		}
	})
)

const installFakeImmediate = createFakeInstaller(({ at, composeOverride, executionController }) =>
	composeOverride(at("setImmediate"), at("clearImmediate"), () => {
		const { setMicro } = createExecutionHooks(executionController)
		const { set: fakeSetImmediate, cancel: fakeClearImmediate } = createSetCancelPairs(setMicro)
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
const installFakePromise = createFakeInstaller(({ at, override }) =>
	override(at("Promise"), () => {
		return {
			fake: createFakePromise()
		}
	})
)

const installFakeTimeout = createFakeInstaller(({ at, composeOverride, executionController }) =>
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

const installFakeInterval = createFakeInstaller(({ at, composeOverride, executionController }) =>
	composeOverride(at("setInterval"), at("clearInterval"), () => {
		const { delayRecursive } = createExecutionHooks(executionController)
		const { set: fakeSetInterval, cancel: fakeClearInterval } = createSetCancelPairs(delayRecursive)
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

const installFakeProcessNextTick = createFakeInstaller(({ at, override, executionController }) =>
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

const installFakeProcessUptime = createFakeInstaller(({ at, override, executionController }) =>
	override(at("process", "uptime"), processUptime => {
		let fakeNano = createNano()
		const getRealUptime = () => processUptime()
		const getFakeUptime = () => fakeNano.getSecondsFloat()

		Object.assign(executionController, {
			getRealUptime,
			getFakeUptime
		})

		return {
			changed: (previousNano, nano) => {
				fakeNano = syncNano(fakeNano, previousNano, nano)
			},
			fake: getFakeUptime
		}
	})
)

const installFakeProcessHrtime = createFakeInstaller(({ at, override, executionController }) =>
	override(at("process", "hrtime"), processHrtime => {
		const createNanoFromSecondsAndNanoseconds = ([seconds, nanoseconds]) =>
			createNano(convertSecondsToMilliseconds(seconds), nanoseconds)
		let fakeNano = createNano()
		const getRealHrtime = () => processHrtime()
		const getFakeHrtime = time => {
			if (time) {
				const timeNano = createNanoFromSecondsAndNanoseconds(time)
				const diffNano = fakeNano.minus(timeNano)
				return [diffNano.getSecondsFloat(), diffNano.getNanoseconds()]
			}
			return [fakeNano.getSecondsFloat(), fakeNano.getNanoseconds()]
		}

		Object.assign(executionController, {
			getRealHrtime,
			getFakeHrtime
		})

		return {
			changed: (previousNano, nano) => {
				fakeNano = syncNano(fakeNano, previousNano, nano)
			},
			fake: getFakeHrtime
		}
	})
)

const installFakeAnimationFrame = createFakeInstaller(
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

const installFakePerformanceNow = createFakeInstaller(({ at, override, executionController }) =>
	override(at("performance", "now"), performanceNow => {
		let fakeNano = createNano()
		const getRealPerformanceNow = () => performanceNow()
		const getFakePerformanceNow = () => fakeNano.getMillisecondsFloat().toFixed(4)

		Object.assign(executionController, {
			getRealPerformanceNow,
			getFakePerformanceNow
		})

		return {
			changed: (previousNano, nano) => {
				fakeNano = syncNano(fakeNano, previousNano, nano)
			},
			fake: getFakePerformanceNow
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

/*
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
