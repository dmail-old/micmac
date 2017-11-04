// https://github.com/substack/node-mkdirp/issues/129

import { createNano, createNanoFromSeconds } from "./nano.js"

import { createTest } from "@dmail/test"
import { expectMatch } from "@dmail/expect"

export default createTest({
	"toString()": () => expectMatch(createNano(1.1).toString(), "1.1"),

	"toSeconds() from 1": () => expectMatch(createNano(1).toSeconds(), 0),
	"toSeconds() from 1000": () => expectMatch(createNano(1000).toSeconds(), 1),
	"toSeconds() from 1001": () => expectMatch(createNano(1001).toSeconds(), 1),
	"toSeconds() from 1500": () => expectMatch(createNano(1500).toSeconds(), 1),
	"toSeconds() from 1900": () => expectMatch(createNano(1900).toSeconds(), 1),

	"toSecondsFloat() from 1": () => expectMatch(createNano(1).toSecondsFloat(), 0.001),
	"toSecondsFloat() from 600": () => expectMatch(createNano(600).toSecondsFloat(), 0.6),
	"toSecondsFloat() from 1001": () => expectMatch(createNano(1001).toSecondsFloat(), 1.001),

	"toMilliseconds() from 1": () => expectMatch(createNano(1).toMilliseconds(), 1),
	"toMilliseconds() from 1000": () => expectMatch(createNano(1000).toMilliseconds(), 1000),
	"toMilliseconds() from 1001": () => expectMatch(createNano(1001).toMilliseconds(), 1001),
	"toMilliseconds() from 1001.1": () => expectMatch(createNano(1001.1).toMilliseconds(), 1001),
	"toMilliseconds() from 1001.5": () => expectMatch(createNano(1001.5).toMilliseconds(), 1001),

	"toMillisecondsFloat() from 1": () => expectMatch(createNano(1).toMillisecondsFloat(), 1),
	"toMillisecondsFloat() from 1.1": () => expectMatch(createNano(1.1).toMillisecondsFloat(), 1.1),
	"toMillisecondsFloat() from 1.0001": () =>
		expectMatch(createNano(1.0001).toMillisecondsFloat(), 1.0001),

	"getNanoseconds() from 1 ": () => expectMatch(createNano(1).getNanoseconds(), 0),
	"getNanoseconds() from 1,10 ": () => expectMatch(createNano(1, 10).getNanoseconds(), 10),
	// "getNanoseconds() from 1, 1000000": () => expectMatch(createNano(1, 1000000).getNanoseconds(), 0),
	// "getNanoseconds() from 1, 1000001": () => expectMatch(createNano(1, 1000001).getNanoseconds(), 1),

	"add() 1 and 1": () =>
		expectMatch(
			createNano(1)
				.add(createNano(1))
				.toMilliseconds(),
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
				.toMillisecondsFloat(),
			2100.883
		),
	// this is very specific, en fait comme on demande une précision à la seconde
	// et qu'en entrée on avait une précision de 3 décimale
	// on augemnte la précision à 3+3 de plus puisqu'il y à 1000ms dans 1ms
	"toSecondsFloat on add 2000.783 & 100.1": () =>
		expectMatch(
			createNano(2000.783)
				.add(createNano(100.1))
				.toSecondsFloat(),
			2.100883
		),
	"toMilliseconds on diff(2, 1)": () =>
		expectMatch(
			createNano(2)
				.substract(createNano(1))
				.toMilliseconds(),
			1
		),
	"getNanoSeconds on diff (1, 12), (1,3)": () =>
		expectMatch(
			createNano(1, 12)
				.substract(createNano(1, 3))
				.getNanoseconds(),
			9
		),
	"createNanoFromSeconds(0).toMilliseconds()": () =>
		expectMatch(createNanoFromSeconds(0).toMilliseconds(), 0),
	"createNanoFromSeconds(1).toMilliseconds()": () =>
		expectMatch(createNanoFromSeconds(1).toMilliseconds(), 1000),
	"createNanoFromSeconds(1.1).toMilliseconds()": () =>
		expectMatch(createNanoFromSeconds(1.1).toMilliseconds(), 1100),
	"createNanoFromSeconds(1.001).toMilliseconds()": () =>
		expectMatch(createNanoFromSeconds(1.001).toMilliseconds(), 1000) // because js
})
