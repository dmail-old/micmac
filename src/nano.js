// http://mikemcl.github.io/big.js/
import Big from "big-js/big"

const NANOSECOND_PER_MILLISECOND = 1000000
const MILLISECOND_PER_SECOND = 1000

export const createNano = ({ millisecond = 0, nanosecond = 0, ...rest } = {}) => {
  if (typeof millisecond !== "number") {
    throw new TypeError(`createNano millisecond must be a number, got ${millisecond}`)
  }
  if (millisecond < 0) {
    throw new Error(`createNano millisecond must be a positive number, got ${millisecond}`)
  }
  if (typeof nanosecond !== "number") {
    throw new TypeError(`createNano nanosecond must be a number, got ${nanosecond}`)
  }
  if (nanosecond < 0) {
    throw new Error(`createNano nanosecond must be a positive number, got ${nanosecond}`)
  }
  const extraKeys = Object.keys(rest)
  if (extraKeys.length > 0) {
    throw new Error(
      `createNano expect millisecond and nanosecond property, got unexpected param: ${extraKeys}`,
    )
  }

  // nanosecond is the most atomic time unit so floating nanosecond makes no sense.
  // so we round them using parseInt below
  nanosecond = parseInt(nanosecond)

  if (nanosecond >= NANOSECOND_PER_MILLISECOND) {
    millisecond += Math.floor(nanosecond / NANOSECOND_PER_MILLISECOND)
    nanosecond %= NANOSECOND_PER_MILLISECOND
  }

  const msAsBig = new Big(millisecond)

  const getSecond = () => Math.floor(msAsBig.div(MILLISECOND_PER_SECOND))

  const getSecondFloat = () => parseFloat(msAsBig.div(MILLISECOND_PER_SECOND))

  const getMillisecond = () => Math.floor(msAsBig)

  const getMillisecondFloat = () => parseFloat(msAsBig.toString())

  const getNanosecond = () => nanosecond

  const toString = () => `nano(${msAsBig.toString()}, ${nanosecond})`

  const valueOf = getMillisecondFloat

  const plus = (otherNano) =>
    createNano({
      millisecond: parseFloat(msAsBig.plus(otherNano.getMillisecondFloat())),
      nanosecond: nanosecond + otherNano.getNanosecond(),
    })

  const minus = (otherNano) =>
    createNano({
      millisecond: parseFloat(msAsBig.minus(otherNano.getMillisecondFloat())),
      nanosecond: nanosecond - otherNano.getNanosecond(),
    })

  const compare = (otherNano) => {
    const millisecondFloat = getMillisecondFloat()
    const otherMillisecondFloat = otherNano.getMillisecondFloat()
    if (millisecondFloat < otherMillisecondFloat) {
      return -1
    }
    if (millisecondFloat > otherMillisecondFloat) {
      return 1
    }
    const nanosecond = getNanosecond()
    const otherNanosecond = otherNano.getNanosecond()
    if (nanosecond < otherNanosecond) {
      return -1
    }
    if (nanosecond > otherNanosecond) {
      return 1
    }
    return 0
  }
  const lowerThan = (otherNano) => compare(otherNano) === -1

  const greaterThan = (otherNano) => compare(otherNano) === 1

  return {
    getSecond,
    getSecondFloat,
    getMillisecond,
    getMillisecondFloat,
    getNanosecond,

    toString,
    valueOf,

    plus,
    minus,

    compare,
    lowerThan,
    greaterThan,
  }
}

export const convertSecondToMillisecond = (second) => second * MILLISECOND_PER_SECOND

export const createNanoFromSecond = (second) =>
  createNano({
    millisecond: convertSecondToMillisecond(second),
  })
