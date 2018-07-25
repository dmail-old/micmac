// https://github.com/substack/node-mkdirp/issues/129

import { expectMatch, expectThrowWith, matchErrorWith, matchTypeErrorWith } from "@dmail/expect"
import { createTest } from "@dmail/test"
import { createNano, createNanoFromSecond } from "./nano.js"

export default createTest({
  "createNano(null)": () =>
    expectThrowWith(
      () => createNano({ millisecond: null }),
      matchTypeErrorWith({
        message: `createNano millisecond must be a number, got null`,
      }),
    ),
  "createNano(-1)": () =>
    expectThrowWith(
      () => createNano({ millisecond: -1 }),
      matchErrorWith({
        message: `createNano millisecond must be a positive number, got -1`,
      }),
    ),
  "createNano(0, undefined)": () =>
    expectThrowWith(
      () =>
        createNano({
          millisecond: 0,
          nanosecond: true,
        }),
      matchTypeErrorWith({
        message: `createNano nanosecond must be a number, got true`,
      }),
    ),
  "createNano(0, -2)": () =>
    expectThrowWith(
      () =>
        createNano({
          millisecond: 0,
          nanosecond: -2,
        }),
      matchErrorWith({
        message: `createNano nanosecond must be a positive number, got -2`,
      }),
    ),

  "toString()": () => expectMatch(createNano({ millisecond: 1.1 }).toString(), "nano(1.1, 0)"),

  "getSecond() from 1": () => expectMatch(createNano({ millisecond: 1 }).getSecond(), 0),
  "getSecond() from 1000": () => expectMatch(createNano({ millisecond: 1000 }).getSecond(), 1),
  "getSecond() from 1001": () => expectMatch(createNano({ millisecond: 1001 }).getSecond(), 1),
  "getSecond() from 1500": () => expectMatch(createNano({ millisecond: 1500 }).getSecond(), 1),
  "getSecond() from 1900": () => expectMatch(createNano({ millisecond: 1900 }).getSecond(), 1),

  "getSecondFloat() from 1": () =>
    expectMatch(createNano({ millisecond: 1 }).getSecondFloat(), 0.001),
  "getSecondFloat() from 600": () =>
    expectMatch(createNano({ millisecond: 600 }).getSecondFloat(), 0.6),
  "getSecondFloat() from 1001": () =>
    expectMatch(createNano({ millisecond: 1001 }).getSecondFloat(), 1.001),

  "getMillisecond() from 1": () => expectMatch(createNano({ millisecond: 1 }).getMillisecond(), 1),
  "getMillisecond() from 1000": () =>
    expectMatch(createNano({ millisecond: 1000 }).getMillisecond(), 1000),
  "getMillisecond() from 1001": () =>
    expectMatch(createNano({ millisecond: 1001 }).getMillisecond(), 1001),
  "getMillisecond() from 1001.1": () =>
    expectMatch(createNano({ millisecond: 1001.1 }).getMillisecond(), 1001),
  "getMillisecond() from 1001.5": () =>
    expectMatch(createNano({ millisecond: 1001.5 }).getMillisecond(), 1001),

  "getMillisecondFloat() from 1": () =>
    expectMatch(createNano({ millisecond: 1 }).getMillisecondFloat(), 1),
  "getMillisecondFloat() from 1.1": () =>
    expectMatch(createNano({ millisecond: 1.1 }).getMillisecondFloat(), 1.1),
  "getMillisecondFloat() from 1.0001": () =>
    expectMatch(createNano({ millisecond: 1.0001 }).getMillisecondFloat(), 1.0001),

  "getNanosecond() from 1 ": () => expectMatch(createNano({ millisecond: 1 }).getNanosecond(), 0),
  "getNanosecond() from 1,10 ": () =>
    expectMatch(createNano({ millisecond: 1, nanosecond: 10 }).getNanosecond(), 10),
  "getNanosecond() from 1, 1000000": () =>
    expectMatch(createNano({ millisecond: 1, nanosecond: 1000000 }).getNanosecond(), 0),
  "getNanosecond() from 1, 1000001": () =>
    expectMatch(createNano({ millisecond: 1, nanosecond: 1000001 }).getNanosecond(), 1),

  "plus() 1 and 1": () =>
    expectMatch(
      createNano({ millisecond: 1 })
        .plus(createNano({ millisecond: 1 }))
        .getMillisecond(),
      2,
    ),
  "plus 1,4 and 1,3": () =>
    expectMatch(
      createNano({ millisecond: 1, nanosecond: 4 })
        .plus(createNano({ millisecond: 1, nanosecond: 3 }))
        .getMillisecond(),
      2,
    ),
  "plus 2000.783 & 100.1": () =>
    expectMatch(
      createNano({ millisecond: 2000.783 })
        .plus(createNano({ millisecond: 100.1 }))
        .getMillisecondFloat(),
      2100.883,
    ),
  // this is very specific, en fait comme on demande une précision à la seconde
  // et qu'en entrée on avait une précision de 3 décimale
  // on augemnte la précision à 3+3 de plus puisqu'il y à 1000ms dans 1ms
  "toSecondFloat on plus 2000.783 & 100.1": () =>
    expectMatch(
      createNano({ millisecond: 2000.783 })
        .plus(createNano({ millisecond: 100.1 }))
        .getSecondFloat(),
      2.100883,
    ),
  "getMillisecond on diff(2, 1)": () =>
    expectMatch(
      createNano({ millisecond: 2 })
        .minus(createNano({ millisecond: 1 }))
        .getMillisecond(),
      1,
    ),
  "getNanoSecond on diff (1, 12), (1,3)": () =>
    expectMatch(
      createNano({ millisecond: 1, nanosecond: 12 })
        .minus(createNano({ millisecond: 1, nanosecond: 3 }))
        .getNanosecond(),
      9,
    ),
  "createNanoFromSecond(0).getMillisecond()": () =>
    expectMatch(createNanoFromSecond(0).getMillisecond(), 0),
  "createNanoFromSecond(1).getMillisecond()": () =>
    expectMatch(createNanoFromSecond(1).getMillisecond(), 1000),
  "createNanoFromSecond(1.1).getMillisecond()": () =>
    expectMatch(createNanoFromSecond(1.1).getMillisecond(), 1100),
  "createNanoFromSecond(1.001).getMillisecond()": () =>
    expectMatch(createNanoFromSecond(1.001).getMillisecond(), 1000), // because js

  "compare nano(10) and nano(9)": () =>
    expectMatch(createNano({ millisecond: 10 }).compare(createNano({ millisecond: 9 })), 1),
  "compare nano(9) and nano(10)": () =>
    expectMatch(createNano({ millisecond: 9 }).compare(createNano({ millisecond: 10 })), -1),
  "compare nano(10) and nano(10)": () =>
    expectMatch(createNano({ millisecond: 10 }).compare(createNano({ millisecond: 10 })), 0),
  "compare nano(0, 5) and nano(0, 4)": () =>
    expectMatch(
      createNano({ millisecond: 0, nanosecond: 5 }).compare(
        createNano({ millisecond: 0, nanosecond: 4 }),
      ),
      1,
    ),
  "compare nano(0, 4) and nano(0, 5)": () =>
    expectMatch(
      createNano({ millisecond: 0, nanosecond: 4 }).compare(
        createNano({ millisecond: 0, nanosecond: 5 }),
      ),
      -1,
    ),
  "compare nano(0, 5) and nano(0, 5)": () =>
    expectMatch(
      createNano({ millisecond: 0, nanosecond: 5 }).compare(
        createNano({ millisecond: 0, nanosecond: 5 }),
      ),
      0,
    ),
})
