import { createExecutionController } from "./createExecutionController.js"
import { createExecutionHooks } from "./createExecutionHooks.js"
import { createSpy } from "@dmail/spy"
import { createTest } from "@dmail/test"
import {
	expectChain,
	expectNotCalled,
	expectCalledOnceWithoutArgument,
	expectCalledTwiceWithoutArgument,
	expectCalledInOrder
} from "@dmail/expect"

export default createTest({
	"setMacro registers a function called when macro is called": () => {
		const { macro, listenMacro } = createExecutionController()
		const { setMacro } = createExecutionHooks({ listenMacro })
		const spy = createSpy()

		setMacro(spy)
		return expectChain(
			() => expectNotCalled(spy),
			() => macro(),
			() => expectCalledOnceWithoutArgument(spy),
			() => macro(),
			// ensure it's removed after being called
			() => expectCalledOnceWithoutArgument(spy)
		)
	},
	"setMacro called during execution registered on next macro": () => {
		const { macro, listenMacro } = createExecutionController()
		const { setMacro } = createExecutionHooks({ listenMacro })
		const spy = createSpy(() => setMacro(spy))

		setMacro(spy)
		return expectChain(
			() => expectNotCalled(spy),
			() => macro(),
			() => expectCalledOnceWithoutArgument(spy),
			() => macro(),
			() => expectCalledTwiceWithoutArgument(spy)
		)
	},
	"setMacro returns a function cancelling execution": () => {
		const { macro, listenMacro } = createExecutionController()
		const { setMacro } = createExecutionHooks({ listenMacro })
		const spy = createSpy()

		const cancel = setMacro(spy)
		cancel()
		macro()
		return expectNotCalled(spy)
	},
	"setMicro registers a function called when micro is called": () => {
		const { micro, listenMicro } = createExecutionController()
		const { setMicro } = createExecutionHooks({ listenMicro })
		const spy = createSpy()

		return expectChain(
			() => setMicro(spy),
			() => expectNotCalled(spy),
			() => micro(),
			() => expectCalledOnceWithoutArgument(spy)
		)
	},
	"setMicro called during execution are executed at the end of current micros": () => {
		const { micro, listenMicro } = createExecutionController()
		const { setMicro } = createExecutionHooks({ listenMicro })
		const secondSpy = createSpy()
		const thirdSpy = createSpy()
		const firstSpy = createSpy(() => setMicro(thirdSpy))

		setMicro(firstSpy)
		setMicro(secondSpy)
		micro()
		return expectCalledInOrder(firstSpy, secondSpy, thirdSpy)
	},
	"micros auto called after macros": () => {
		const { listenMicro, macro, listenMacro } = createExecutionController()
		const { setMicro, setMacro } = createExecutionHooks({ listenMicro, listenMacro })
		const microSpy = createSpy()
		const macroSpy = createSpy()

		setMicro(microSpy)
		setMacro(macroSpy)
		macro()
		return expectCalledInOrder(macroSpy, microSpy)
	},
	"delay immediatly calls when delayed by zero": () => {
		const { tick, listenMacro } = createExecutionController()
		const { delay } = createExecutionHooks({ listenMacro })
		const spy = createSpy()

		delay(spy)
		return expectChain(
			() => expectNotCalled(spy),
			() => tick(),
			() => expectCalledOnceWithoutArgument(spy)
		)
	},
	"ensure late delayed function are called": () => {
		const { tick, listenMacro } = createExecutionController()
		const { delay } = createExecutionHooks({ listenMacro })
		const spy = createSpy()

		delay(spy, 10)
		tick(20)
		return expectCalledOnceWithoutArgument(spy)
	},
	"can cancel delayed function": () => {
		const { tick, listenMacro } = createExecutionController()
		const { delay } = createExecutionHooks({ listenMacro })
		const spy = createSpy()
		const cancel = delay(spy)
		cancel()
		tick()
		return expectNotCalled(spy)
	},
	"delayRecursive auto delay same function in next ideal delayed ms": () => {
		const { tick, listenMacro } = createExecutionController()
		const { delayRecursive } = createExecutionHooks({ listenMacro })
		const spy = createSpy()
		delayRecursive(spy)
		tick()
		return expectChain(
			() => expectCalledOnceWithoutArgument(spy),
			() => tick(),
			() => expectCalledTwiceWithoutArgument(spy)
		)
	},
	"delayRecursive tries to respect intervalMs": () => {
		const { tick, listenMacro } = createExecutionController()
		const { delayRecursive } = createExecutionHooks({ listenMacro })
		const spy = createSpy()
		delayRecursive(spy, 10)
		tick(33)
		return expectChain(
			() => expectCalledOnceWithoutArgument(spy),
			() => tick(6),
			() => expectCalledOnceWithoutArgument(spy),
			() => tick(1),
			() => expectCalledTwiceWithoutArgument(spy)
		)
	},
	"delayRecursive cancelled inside function prevent recursive delay": () => {
		const { tick, listenMacro } = createExecutionController()
		const { delayRecursive } = createExecutionHooks({ listenMacro })
		let cancel
		const spy = createSpy(() => {
			cancel()
		})
		cancel = delayRecursive(spy)
		tick()
		expectCalledOnceWithoutArgument(spy)
		tick()
		expectCalledOnceWithoutArgument(spy)
	},
	"delayRecursive cancelled outside before next tick prevent recursive": () => {
		const { tick, listenMacro } = createExecutionController()
		const { delayRecursive } = createExecutionHooks({ listenMacro })
		const spy = createSpy()
		const cancel = delayRecursive(spy)

		tick()
		return expectChain(
			() => expectCalledOnceWithoutArgument(spy),
			() => {
				cancel()
				tick()
			},
			() => expectCalledOnceWithoutArgument(spy)
		)
	}
})
