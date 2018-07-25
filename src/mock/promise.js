import { createMicroVolatileReaction } from "../createVolatileReaction.js"
import { createFakePromise } from "./FakePromise.js"
import { createFunctionRegisteringCallback } from "./immediate.js"
import { createFakeInstaller } from "./util.js"

// the purpose of installing fake promise is that our fakePromise will rely on our own
// micro tasks implementation. It makes us capable of controlling promise execution
// https://github.com/charleshansen/mock-promises
export const installFakePromise = createFakeInstaller(({ at, override, executionController }) =>
  override(at("Promise"), () => {
    const microCallback = createFunctionRegisteringCallback({
      registerVolatileReaction: createMicroVolatileReaction(executionController),
    })

    return {
      fake: createFakePromise({
        microCallback,
      }),
    }
  }),
)
