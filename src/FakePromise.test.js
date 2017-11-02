import { FakePromise } from "./FakePromise.js"
import { createTest } from "@dmail/test"
import {
	expectFunction,
	matchProperties,
	expectResolvedWith,
	expectRejectedWith
} from "@dmail/expect"

export default createTest({
	"is a function": () => expectFunction(FakePromise),
	"can resolve": () => expectResolvedWith(new FakePromise(resolve => resolve())),
	"resolve unwrap resolved promise": () => {
		const expectedValue = 10
		const promise = FakePromise.resolve(FakePromise.resolve(expectedValue))
		return expectResolvedWith(promise, expectedValue)
	},
	"resolve unwrap rejected promise": () =>
		expectRejectedWith(FakePromise.resolve(FakePromise.reject())),
	"can reject": () => expectRejectedWith(new FakePromise((resolve, reject) => reject())),
	"reject does not unwrap resolved promise": () => {
		const resolvedPromise = Promise.resolve()
		const promise = FakePromise.reject(resolvedPromise)
		return expectRejectedWith(promise, resolvedPromise)
	},
	"all with empty array": () => {
		const values = ["a", "b"]
		const promise = FakePromise.all(values)
		return expectResolvedWith(promise, matchProperties(values))
	},
	"all with non thenable and thenable values": () => {
		const values = [0, FakePromise.resolve(1), 2, Promise.resolve(3)]
		const promise = FakePromise.all(values)
		return expectResolvedWith(promise, matchProperties([0, 1, 2, 3]))
	},
	"throw while reading thenable.then creates a rejected promise": () => {
		const thenable = {}
		const exception = 1
		Object.defineProperty(thenable, "then", {
			get: () => {
				throw exception
			}
		})
		const promise = FakePromise.resolve(thenable)
		return expectRejectedWith(promise, exception)
	},
	"throw while executing thenable.then creates a rejected promise": () => {
		const exception = 1
		const promise = FakePromise.resolve({
			then: () => {
				throw exception
			}
		})
		return expectRejectedWith(promise, exception)
	}
})
