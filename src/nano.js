// http://mikemcl.github.io/big.js/
import Big from "big-js"

const NANOSECOND_PER_MILLISECOND = 1000000
const MILLISECOND_PER_SECOND = 1000

export const createNano = (milliseconds = 0, nanoseconds = 0) => {
	if (typeof milliseconds !== "number") {
		throw new TypeError(`createNano first arg must be milliseconds, got ${milliseconds}`)
	}
	if (milliseconds < 0) {
		throw new Error(`createNano first arg must be positive milliseconds, got ${milliseconds}`)
	}
	if (typeof nanoseconds !== "number") {
		throw new TypeError(`createNano second arg must be nanoseconds, got ${nanoseconds}`)
	}
	if (nanoseconds < 0) {
		throw new Error(`createNano second arg must be positive nanoseconds, got ${nanoseconds}`)
	}

	// just in case someone thinks nanoseconds float are a great idea we round them
	// because nanoseconds is the most atomic time unit so float makes no sense
	nanoseconds = parseInt(nanoseconds)

	if (nanoseconds >= NANOSECOND_PER_MILLISECOND) {
		milliseconds += Math.floor(nanoseconds / NANOSECOND_PER_MILLISECOND)
		nanoseconds %= NANOSECOND_PER_MILLISECOND
	}

	const msAsBig = new Big(milliseconds)

	const getSeconds = () => Math.floor(msAsBig.div(MILLISECOND_PER_SECOND))
	const getSecondsFloat = () => parseFloat(msAsBig.div(MILLISECOND_PER_SECOND))
	const getMilliseconds = () => Math.floor(msAsBig)
	const getMillisecondsFloat = () => parseFloat(msAsBig.toString())
	const getNanoseconds = () => nanoseconds
	const toString = () => `nano(${msAsBig.toString()}, ${nanoseconds})`
	const valueOf = getMillisecondsFloat

	const plus = otherNano =>
		createNano(
			parseFloat(msAsBig.plus(otherNano.getMillisecondsFloat())),
			nanoseconds + otherNano.getNanoseconds()
		)
	const minus = otherNano =>
		createNano(
			parseFloat(msAsBig.minus(otherNano.getMillisecondsFloat())),
			nanoseconds - otherNano.getNanoseconds()
		)
	const compare = otherNano => {
		const millisecondsFloat = getMillisecondsFloat()
		const otherMillisecondsFloat = otherNano.getMillisecondsFloat()
		if (millisecondsFloat < otherMillisecondsFloat) {
			return -1
		}
		if (millisecondsFloat > otherMillisecondsFloat) {
			return 1
		}
		const nanoseconds = getNanoseconds()
		const otherNanoseconds = otherNano.getNanoseconds()
		if (nanoseconds < otherNanoseconds) {
			return -1
		}
		if (nanoseconds > otherNanoseconds) {
			return 1
		}
		return 0
	}
	const lowerThan = otherNano => compare(otherNano) === -1
	const greaterThan = otherNano => compare(otherNano) === 1

	return {
		getSeconds,
		getSecondsFloat,
		getMilliseconds,
		getMillisecondsFloat,
		getNanoseconds,

		toString,
		valueOf,

		plus,
		minus,

		compare,
		lowerThan,
		greaterThan
	}
}

export const convertSecondsToMilliseconds = seconds => seconds * MILLISECOND_PER_SECOND

export const createNanoFromSeconds = seconds => createNano(convertSecondsToMilliseconds(seconds))
