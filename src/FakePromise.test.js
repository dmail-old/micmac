import { FakePromise } from "./FakePromise.js"
import { createTest } from "@dmail/test"
import { expectFunction, expectMatch, expectProperties } from "@dmail/expect"

// todo: must accept a thenable and return a passed/failed action
// according to promise.then(onResolve, onReject) calls
const expectResolved = () => {}
const expectRejected = () => {}

export default createTest({
	"is a function": () => expectFunction(FakePromise),
	"can resolve": () => expectResolved(new FakePromise(resolve => resolve())),
	"resolve unwrap resolved promise": () => {
		const expectedValue = 10
		return expectResolved(FakePromise.resolve(FakePromise.resolve(expectedValue))).then(value =>
			expectMatch(value, expectedValue)
		)
	},
	"resolve unwrap rejected promise": () =>
		expectRejected(FakePromise.resolve(FakePromise.reject())),
	"can reject": () => expectRejected(new FakePromise((resolve, reject) => reject())),
	"reject does not unwrap resolved promise": () => {
		const resolvedPromise = Promise.resolve()
		return expectRejected(FakePromise.reject(resolvedPromise)).then(reason =>
			expectMatch(reason, resolvedPromise)
		)
	},
	"all with empty array": () => {
		const values = ["a", "b"]
		return expectResolved(FakePromise.all(values)).then(value => {
			// assertDifferent(value, values)
			return expectProperties(value, values)
		})
	},
	"all with non thenable and thenable values": () => {
		const values = [0, FakePromise.resolve(1), 2, Promise.resolve(3)]
		return expectResolved(FakePromise.all(values)).then(value =>
			expectProperties(value, [0, 1, 2, 3])
		)
	},
	"throw while reading thenable.then creates a rejected promise": () => {
		const thenable = {}
		const exception = 1
		Object.defineProperty(thenable, "then", {
			get: () => {
				throw exception
			}
		})
		return expectResolved(FakePromise.resolve(thenable)).then(reason =>
			expectMatch(reason, exception)
		)
	},
	"throw while executing thenable.then creates a rejected promise": () => {
		const exception = 1
		return expectRejected(
			FakePromise.resolve({
				then: () => {
					throw exception
				}
			})
		).then(reason => expectMatch(reason, exception))
	}
})
