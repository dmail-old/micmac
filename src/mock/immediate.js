import { createFakeInstaller, createSetCancelPairs } from "./util.js"

export const createFunctionRegisteringMacroCallback = ({ macroVolatileReaction }) => {
  return (fn, ...args) => {
    const reaction = macroVolatileReaction({
      action: () => fn(...args),
    })

    return () => {
      if (reaction.isCancellable()) {
        reaction.cancel()
      }
    }
  }
}

export const installFakeImmediate = createFakeInstaller(
  ({ at, composeOverride, executionController }) =>
    composeOverride(at("setImmediate"), at("clearImmediate"), () => {
      const { set: fakeSetImmediate, cancel: fakeClearImmediate } = createSetCancelPairs(
        createFunctionRegisteringMacroCallback(executionController),
      )

      return [
        {
          fake: fakeSetImmediate,
        },
        {
          fake: fakeClearImmediate,
        },
      ]
    }),
)
