// https://github.com/substack/node-mkdirp/issues/129

import { createNano, createNanoFromSeconds } from "./nano.js"

import { createTest } from "@dmail/test"
import { expectMatch } from "@dmail/expect"

export default createTest({
	"toString()": () => expectMatch(createNano(1.1).toString(), "nano(1.1, 0)"),

	"getSeconds() from 1": () => expectMatch(createNano(1).getSeconds(), 0),
	"getSeconds() from 1000": () => expectMatch(createNano(1000).getSeconds(), 1),
	"getSeconds() from 1001": () => expectMatch(createNano(1001).getSeconds(), 1),
	"getSeconds() from 1500": () => expectMatch(createNano(1500).getSeconds(), 1),
	"getSeconds() from 1900": () => expectMatch(createNano(1900).getSeconds(), 1),

	"getSecondsFloat() from 1": () => expectMatch(createNano(1).getSecondsFloat(), 0.001),
	"getSecondsFloat() from 600": () => expectMatch(createNano(600).getSecondsFloat(), 0.6),
	"getSecondsFloat() from 1001": () => expectMatch(createNano(1001).getSecondsFloat(), 1.001),

	"getMilliseconds() from 1": () => expectMatch(createNano(1).getMilliseconds(), 1),
	"getMilliseconds() from 1000": () => expectMatch(createNano(1000).getMilliseconds(), 1000),
	"getMilliseconds() from 1001": () => expectMatch(createNano(1001).getMilliseconds(), 1001),
	"getMilliseconds() from 1001.1": () => expectMatch(createNano(1001.1).getMilliseconds(), 1001),
	"getMilliseconds() from 1001.5": () => expectMatch(createNano(1001.5).getMilliseconds(), 1001),

	"getMillisecondsFloat() from 1": () => expectMatch(createNano(1).getMillisecondsFloat(), 1),
	"getMillisecondsFloat() from 1.1": () => expectMatch(createNano(1.1).getMillisecondsFloat(), 1.1),
	"getMillisecondsFloat() from 1.0001": () =>
		expectMatch(createNano(1.0001).getMillisecondsFloat(), 1.0001),

	"getNanoseconds() from 1 ": () => expectMatch(createNano(1).getNanoseconds(), 0),
	"getNanoseconds() from 1,10 ": () => expectMatch(createNano(1, 10).getNanoseconds(), 10),
	// "getNanoseconds() from 1, 1000000": () => expectMatch(createNano(1, 1000000).getNanoseconds(), 0),
	// "getNanoseconds() from 1, 1000001": () => expectMatch(createNano(1, 1000001).getNanoseconds(), 1),

	"add() 1 and 1": () =>
		expectMatch(
			createNano(1)
				.add(createNano(1))
				.getMilliseconds(),
			2
		),
	"add 1,4 and 1,3": () =>
		expectMatch(
			createNano(1, 4)
				.add(createNano(1, 3))
				.getNanoseconds(),
			7
		),
	"add 2000.783 & 100.1": () =>
		expectMatch(
			createNano(2000.783)
				.add(createNano(100.1))
				.getMillisecondsFloat(),
			2100.883
		),
	// this is very specific, en fait comme on demande une précision à la seconde
	// et qu'en entrée on avait une précision de 3 décimale
	// on augemnte la précision à 3+3 de plus puisqu'il y à 1000ms dans 1ms
	"toSecondsFloat on add 2000.783 & 100.1": () =>
		expectMatch(
			createNano(2000.783)
				.add(createNano(100.1))
				.getSecondsFloat(),
			2.100883
		),
	"getMilliseconds on diff(2, 1)": () =>
		expectMatch(
			createNano(2)
				.substract(createNano(1))
				.getMilliseconds(),
			1
		),
	"getNanoSeconds on diff (1, 12), (1,3)": () =>
		expectMatch(
			createNano(1, 12)
				.substract(createNano(1, 3))
				.getNanoseconds(),
			9
		),
	"createNanoFromSeconds(0).getMilliseconds()": () =>
		expectMatch(createNanoFromSeconds(0).getMilliseconds(), 0),
	"createNanoFromSeconds(1).getMilliseconds()": () =>
		expectMatch(createNanoFromSeconds(1).getMilliseconds(), 1000),
	"createNanoFromSeconds(1.1).getMilliseconds()": () =>
		expectMatch(createNanoFromSeconds(1.1).getMilliseconds(), 1100),
	"createNanoFromSeconds(1.001).getMilliseconds()": () =>
		expectMatch(createNanoFromSeconds(1.001).getMilliseconds(), 1000) // because js

	// must test compare too
})
