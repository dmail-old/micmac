import { createFakeInstaller } from "./util.js"

export const createFunctionRegisteringMicroCallback = ({ microVolatileReaction }) => {
  return (fn, ...args) => {
    const reaction = microVolatileReaction({
      action: () => fn(...args),
    })

    return () => {
      if (reaction.isPending()) {
        reaction.cancel()
      }
    }
  }
}

export const installFakeProcessNextTick = createFakeInstaller(
  ({ at, override, executionController }) =>
    override(at("process", "nextTick"), () => {
      const registerMicroCallback = createFunctionRegisteringMicroCallback(executionController)
      const fakeProcessNextTick = (fn, ...args) => {
        registerMicroCallback(fn, ...args)
      }

      return {
        fake: fakeProcessNextTick,
      }
    }),
)
