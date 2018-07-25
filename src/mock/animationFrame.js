import { createFunctionRegisteringDelayedMacroCallback } from "./timeout.js"
import { createFakeInstaller, createSetCancelPairs } from "./util.js"

const fps = 60
const rate = 1000 / fps

export const installFakeAnimationFrame = createFakeInstaller(
  ({ at, composeOverride, executionController }) =>
    composeOverride(at("requestAnimationFrame"), at("cancelAnimationFrame"), () => {
      const registerDelayedMacroCallback = createFunctionRegisteringDelayedMacroCallback(
        executionController,
      )
      const {
        set: fakeRequestAnimationFrame,
        cancel: fakeCancelAnimationFrame,
      } = createSetCancelPairs((fn) => registerDelayedMacroCallback(fn, rate))

      return [
        {
          fake: fakeRequestAnimationFrame,
        },
        {
          fake: fakeCancelAnimationFrame,
        },
      ]
    }),
)
