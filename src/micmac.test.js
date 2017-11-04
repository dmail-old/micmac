// https://github.com/substack/node-mkdirp/issues/129

import { mockExecution } from "./micmac.js"
import { sum, sub } from "./nano.js"

import { createTest } from "@dmail/test"
import { createSpy } from "@dmail/spy"
import {
	expectChain,
	matchNot,
	expectMatch,
	expectCalledOnceWithoutArgument,
	expectCalledTwiceWithoutArgument,
	expectCalledOnceWith,
	expectNotCalled
} from "@dmail/expect"

export default createTest({
	"mockExecution temp overrides global Date constructor": () => {
		const globalDate = Date
		return expectChain(
			() => mockExecution(() => expectMatch(globalDate, matchNot(Date))),
			() => expectMatch(globalDate, Date)
		)
	},
	"Date.now() and new Date().getTime() returns fake amount of ms": () =>
		mockExecution(({ tick, tickRelative, setTimeReference }) => {
			const ms = Date.now()
			return expectChain(
				() => expectMatch(Date.now(), ms),
				() => tick(10),
				() => expectMatch(Date.now(), ms + 10),
				() => expectMatch(new Date().getTime(), ms + 10),
				() => expectMatch(new Date("1 January 1970 00:00:00 UTC").getTime(), 0),
				() => tickRelative(10),
				() => expectMatch(Date.now(), ms + 10),
				() => setTimeReference(),
				() => expectMatch(Date.now(), 0)
			)
		}),
	"process.uptime": () =>
		mockExecution(({ tick }) => {
			const uptime = process.uptime()
			const addedMs = 10
			tick(addedMs)
			const actualUptime = process.uptime()
			const expectedUptime = sum(uptime, addedMs / 1000)
			return expectMatch(actualUptime, expectedUptime)
		}),
	"process.hrtime": () =>
		mockExecution(({ tick }) => {
			const [initialSeconds, initialNanoseconds] = process.hrtime()
			const addedMs = 10
			const addedNs = 20
			const removedSeconds = 20
			const removedNs = 100

			return expectChain(
				() => tick(addedMs, addedNs),
				() => process.hrtime(),
				([seconds, nanoseconds]) => {
					const expectedSeconds = sum(initialSeconds, addedMs / 1000)
					const expectedNanoseconds = initialNanoseconds + addedNs
					return expectChain(
						() => expectMatch(seconds, expectedSeconds),
						() => expectMatch(nanoseconds, expectedNanoseconds)
					)
				},
				() => process.hrtime([removedSeconds, removedNs], [initialSeconds, initialNanoseconds]),
				([seconds, nanoseconds]) => {
					const expectedSeconds = sub(sum(initialSeconds, addedMs / 1000), removedSeconds)
					const expectedNanoseconds = initialNanoseconds + addedNs - removedNs
					return expectChain(
						() => expectMatch(seconds, expectedSeconds),
						() => expectMatch(nanoseconds, expectedNanoseconds)
					)
				}
			)
		}),
	"process.nextTick": () =>
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

			const expectPending = (...args) => args.forEach(arg => expectMatch(arg.status, "pending"))
			const expectFulfilled = (...args) => args.forEach(arg => expectMatch(arg.status, "fulfilled"))
			const expectResolved = (...args) => args.forEach(arg => expectMatch(arg.status, "resolved"))

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
