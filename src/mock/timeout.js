import { createFakeInstaller, createSetCancelPairs } from "./util.js"

export const createFunctionRegisteringDelayedMacroCallback = ({
  getNano,
  macroVolatileReaction,
}) => {
  return (fn, millisecond = 0, ...args) => {
    const millisecondExpected = getNano().getMilliSecond() + millisecond
    const reaction = macroVolatileReaction({
      condition: () => getNano().getMilliSecond() >= millisecondExpected,
      action: () => fn(...args),
    })

    return () => {
      if (reaction.isPending()) {
        reaction.cancel()
      }
    }
  }
}

export const installFakeTimeout = createFakeInstaller(
  ({ at, composeOverride, executionController }) =>
    composeOverride(at("setTimeout"), at("clearTimeout"), () => {
      const { set: fakeSetTimeout, cancel: fakeClearTimeout } = createSetCancelPairs(
        createFunctionRegisteringDelayedMacroCallback(executionController),
      )

      return [
        {
          fake: fakeSetTimeout,
        },
        {
          fake: fakeClearTimeout,
        },
      ]
    }),
)
