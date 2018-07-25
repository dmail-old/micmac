import { createFakeInstaller, createSetCancelPairs } from "./util.js"

export const createFunctionRegisteringPeriodicMacroCallback = ({
  macroVolatileReaction,
  getNano,
}) => {
  return (fn, intervalInMillisecond = 0, ...args) => {
    const millisecondExpected = getNano().getMilliSecond() + intervalInMillisecond

    let nextReaction
    const reaction = macroVolatileReaction({
      condition: () => getNano().getMillisecond() >= millisecondExpected,
      action: () => {
        fn(...args)

        const registerNextVolatileReaction = () => {
          // Let's take as example that 23 millisecond ellapsed but we expected
          // to be called after 10 millisecond. In that case, the next expected call is at 30 millisecond.
          const millisecondNow = getNano().getMillisecond()
          const millisecondExpected =
            millisecondNow + intervalInMillisecond - millisecondNow % intervalInMillisecond

          nextReaction = macroVolatileReaction({
            condition: () => getNano().getMillisecond() >= millisecondExpected,
            action: () => {
              fn(...args)
              registerNextVolatileReaction()
            },
          })
        }
        registerNextVolatileReaction()
      },
    })

    return () => {
      if (reaction.isPending()) {
        reaction.cancel()
      } else if (nextReaction && nextReaction.isPending()) {
        nextReaction.cancel()
      }
    }
  }
}

export const installFakeInterval = createFakeInstaller(
  ({ at, composeOverride, executionController }) =>
    composeOverride(at("setInterval"), at("clearInterval"), () => {
      const { set: fakeSetInterval, cancel: fakeClearInterval } = createSetCancelPairs(
        createFunctionRegisteringPeriodicMacroCallback(executionController),
      )

      return [
        {
          fake: fakeSetInterval,
        },
        {
          fake: fakeClearInterval,
        },
      ]
    }),
)
