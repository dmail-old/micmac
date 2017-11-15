// http://mikemcl.github.io/big.js/
import Big from "big-js"

// const NANOSECOND_PER_MILLISECOND = 1000000
const MILLISECOND_PER_SECOND = 1000

export const createNano = (ms = 0, nanoseconds = 0) => {
	// just in case someone thinks nanoseconds float are a great idea we round them
	// because nanoseconds is the most atomic time unit so float makes no sense
	nanoseconds = parseInt(nanoseconds)

	// if (nanoseconds > 0) {
	// 	while (nanoseconds >= NANOSECOND_PER_MILLISECOND) {
	// 		nanoseconds -= NANOSECOND_PER_MILLISECOND
	// 		ms++
	// 	}
	// } else if (nanoseconds < 0) {
	// 	while (nanoseconds < 0) {
	// 		nanoseconds += NANOSECOND_PER_MILLISECOND
	// 		ms--
	// 	}
	// }

	const msAsBig = new Big(ms)

	const getSeconds = () => Math.floor(msAsBig.div(MILLISECOND_PER_SECOND))
	const getSecondsFloat = () => parseFloat(msAsBig.div(MILLISECOND_PER_SECOND))
	const getMilliseconds = () => Math.floor(msAsBig)
	const getMillisecondsFloat = () => parseFloat(msAsBig.toString())
	const getNanoseconds = () => nanoseconds
	const toString = () => `nano(${msAsBig.toString()}, ${nanoseconds})`
	const valueOf = getMillisecondsFloat

	const sum = otherNano =>
		createNano(
			parseFloat(msAsBig.plus(otherNano.getMillisecondsFloat())),
			nanoseconds + otherNano.getNanoseconds()
		)
	const substract = otherNano =>
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

	return {
		getSeconds,
		getSecondsFloat,
		getMilliseconds,
		getMillisecondsFloat,
		getNanoseconds,

		toString,
		valueOf,

		sum,
		substract,

		add: sum,
		diff: substract,
		sub: substract,

		compare
	}
}

export const convertSecondsToMilliseconds = seconds => seconds * MILLISECOND_PER_SECOND

export const createNanoFromSeconds = seconds => createNano(convertSecondsToMilliseconds(seconds))

export const sum = (a, b) => parseFloat(new Big(a).plus(b))
export const sub = (a, b) => parseFloat(new Big(a).minus(b))
