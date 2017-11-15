// https://github.com/substack/node-mkdirp/issues/129

import { mockExecution } from "./micmac.js"

import { createTest } from "@dmail/test"
import { createSpy } from "@dmail/spy"
import {
	expectChain,
	matchNot,
	expectMatch,
	expectCalledOnceWithoutArgument,
	expectCalledTwiceWithoutArgument,
	expectCalledOnceWith,
	expectNotCalled,
	expectThrowWith,
	matchTypeErrorWith,
	matchErrorWith,
	matchProperties
} from "@dmail/expect"

export default createTest({
	"when passed, tick first arg must be a positive number": () =>
		mockExecution(({ tick }) =>
			expectChain(
				() =>
					expectThrowWith(
						() => tick(null),
						matchTypeErrorWith({
							message: `tick first arg must be milliseconds, got null`
						})
					),
				() =>
					expectThrowWith(
						() => tick(-1),
						matchErrorWith({
							message: `tick first arg must be positive milliseconds, got -1`
						})
					)
			)
		),
	"getRealNow() with tick & tickAbsolute": () => {
		const RealDate = Date
		return mockExecution(({ getRealNow, tick, tickAbsolute }) =>
			expectChain(
				() => expectMatch(getRealNow(), RealDate.now()),
				() => tick(10),
				() => tick(2),
				() => expectMatch(getRealNow(), RealDate.now()),
				() => tickAbsolute(23),
				() => expectMatch(getRealNow(), RealDate.now())
			)
		)
	},
	"getFakeNow() with tick & tickAbsolute": () =>
		mockExecution(({ getFakeNow, tick, tickAbsolute }) => {
			return expectChain(
				() => expectMatch(getFakeNow(), 0),
				() => tick(10),
				() => tick(2),
				() => expectMatch(getFakeNow(), 12),
				() => tickAbsolute(23),
				() => expectMatch(getFakeNow(), 23)
			)
		}),
	"Date.now() with tick, tickAbsolute": () =>
		mockExecution(({ tick, tickAbsolute }) =>
			expectChain(
				() => expectMatch(Date.now(), 0),
				() => tick(10),
				() => tick(2),
				() => expectMatch(Date.now(), 12),
				() => tickAbsolute(5),
				() => expectMatch(Date.now(), 5)
			)
		),
	"new Date().getTime() with tick, tickAbsolute": () =>
		mockExecution(({ tick, tickAbsolute }) =>
			expectChain(
				() => expectMatch(new Date().getTime(), 0),
				() => tick(10),
				() => tick(2),
				() => expectMatch(new Date().getTime(), 12),
				() => tickAbsolute(5),
				() => expectMatch(new Date().getTime(), 5)
			)
		),
	"new Date('1 January 1970 00:00:00 UTC').getTime() with tick, tickAbsolute": () =>
		mockExecution(({ tick, tickAbsolute }) =>
			expectChain(
				() => expectMatch(new Date("1 January 1970 00:00:00 UTC").getTime(), 0),
				() => tick(10),
				() => tick(2),
				() => expectMatch(new Date("1 January 1970 00:00:00 UTC").getTime(), 0),
				() => tickAbsolute(5),
				() => expectMatch(new Date("1 January 1970 00:00:00 UTC").getTime(), 0)
			)
		),
	"mockExecution temp overrides global Date constructor": () => {
		const globalDate = Date
		return expectChain(
			() => mockExecution(() => expectMatch(globalDate, matchNot(Date))),
			() => expectMatch(globalDate, Date)
		)
	},
	"FakeDate.now valid once uninstalled": () =>
		expectMatch(mockExecution(() => Date).now(), Date.now()),
	"process.uptime()": () =>
		mockExecution(({ tick }) => {
			tick(10)
			return expectMatch(process.uptime(), 0.01)
		}),
	"process.hrtime()": () =>
		mockExecution(({ tick }) =>
			expectChain(
				() => expectMatch(process.hrtime(), matchProperties([0, 0])),
				() => tick(10, 20),
				() => expectMatch(process.hrtime(), matchProperties([0.01, 20])),
				() => expectMatch(process.hrtime([0.002, 12]), matchProperties([0.008, 8]))
			)
		),
	"process.nextTick()": () =>
		mockExecution(({ micro }) => {
			const spy = createSpy()
			const args = [0, 1]
			process.nextTick(spy, ...args)
			return expectChain(
				() => expectNotCalled(spy),
				() => micro(),
				() => expectCalledOnceWith(spy, ...args)
			)
		}),
	"setImmediate()": () =>
		mockExecution(({ micro }) => {
			const spy = createSpy()
			setImmediate(spy)
			return expectChain(
				() => expectNotCalled(spy),
				() => micro(),
				() => expectCalledOnceWithoutArgument(spy)
			)
		}),
	"clearImmediate()": () =>
		mockExecution(({ micro }) => {
			const spy = createSpy()
			const id = setImmediate(spy)

			return expectChain(
				() => expectMatch(clearImmediate("foo"), undefined),
				() => {
					clearImmediate(id)
					micro()
				},
				() => expectNotCalled(spy)
			)
		}),
	"setTimeout function can be trigged using tick": () =>
		mockExecution(({ tick }) => {
			const spy = createSpy()
			setTimeout(spy)
			return expectChain(
				() => expectNotCalled(spy),
				() => tick(),
				() => expectCalledOnceWithoutArgument(spy)
			)
		}),
	"clearTimeout cancels a timeout": () =>
		mockExecution(({ tick }) => {
			const spy = createSpy()
			const id = setTimeout(spy)
			return expectChain(
				() => expectMatch(clearTimeout("foo"), undefined),
				() => {
					clearTimeout(id)
					tick()
				},
				() => expectNotCalled(spy)
			)
		}),
	"setInterval()": () =>
		mockExecution(({ tick }) => {
			const spy = createSpy()
			setInterval(spy, 10)
			return expectChain(
				() => expectNotCalled(spy),
				() => tick(10),
				() => expectCalledOnceWithoutArgument(spy),
				() => tick(10),
				() => expectCalledTwiceWithoutArgument(spy)
			)
		}),
	"clearInterval()": () =>
		mockExecution(({ tick }) => {
			const spy = createSpy()
			const id = setInterval(spy, 10)
			return expectChain(
				() => expectNotCalled(spy),
				() => tick(10),
				() => expectCalledOnceWithoutArgument(spy),
				() => expectMatch(clearInterval("foo"), undefined),
				() => {
					clearInterval(id)
					tick(10)
				},
				() => expectCalledOnceWithoutArgument(spy)
			)
		}),
	"calling micro calls promise onFullfill": () =>
		mockExecution(({ micro }) => {
			const spy = createSpy()
			Promise.resolve().then(spy)
			return expectChain(
				() => expectNotCalled(spy),
				() => micro(),
				() => expectCalledOnceWith(spy, undefined)
			)
		}),
	"example with time dependent nested promise": () =>
		mockExecution(({ tick }) => {
			const createPromiseResolvedIn = (ms, value) =>
				new Promise(resolve => setTimeout(resolve, ms, value))
			const nestedPromise = createPromiseResolvedIn(10)
			const innerPromise = new Promise(resolve => resolve(nestedPromise))
			const outerPromise = createPromiseResolvedIn(20, innerPromise)

			const expectPending = (...args) =>
				expectChain(...args.map(arg => () => expectMatch(arg.status, "pending")))
			const expectFulfilled = (...args) =>
				expectChain(...args.map(arg => () => expectMatch(arg.status, "fulfilled")))
			const expectResolved = (...args) =>
				expectChain(...args.map(arg => () => expectMatch(arg.status, "resolved")))

			return expectChain(
				() => expectPending(nestedPromise, outerPromise),
				() => expectResolved(innerPromise),
				() => tick(10),
				() => expectFulfilled(nestedPromise, innerPromise),
				() => expectPending(outerPromise),
				() => tick(20),
				() => expectFulfilled(nestedPromise, innerPromise, outerPromise)
			)
		})
})
