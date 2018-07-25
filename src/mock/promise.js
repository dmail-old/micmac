import { createFakePromise } from "./FakePromise.js"
import { createFunctionRegisteringMicroCallback } from "./processNextTick.js"
import { createFakeInstaller } from "./util.js"

// the purpose of installing fake promise is that our fakePromise will rely on our own
// micro tasks implementation. It makes us capable of controlling promise execution
// https://github.com/charleshansen/mock-promises
export const installFakePromise = createFakeInstaller(({ at, override, executionController }) =>
  override(at("Promise"), () => {
    return {
      fake: createFakePromise({
        microCallback: createFunctionRegisteringMicroCallback(executionController),
      }),
    }
  }),
)
