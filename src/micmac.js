// https://github.com/jasmine/jasmine/blob/9cb2f06aa665870dbd5df5fd58a35863738961b3/src/core/Clock.js
// https://gist.github.com/kevinoid/3146420
// https://github.com/jasmine/jasmine/blob/9cb2f06aa665870dbd5df5fd58a35863738961b3/src/core/DelayedFunctionScheduler.js
// https://github.com/jasmine/jasmine/blob/9cb2f06aa665870dbd5df5fd58a35863738961b3/src/core/Clock.js
// http://voidcanvas.com/setimmediate-vs-nexttick-vs-settimeout/
// https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/

import { createExecutionController } from "./createExecutionController.js"
import {
  installFakeAnimationFrame,
  installFakeDate,
  installFakeImmediate,
  installFakeInterval,
  installFakePerformanceNow,
  installFakeProcessHrtime,
  installFakeProcessNextTick,
  installFakeProcessUptime,
  installFakePromise,
  installFakeTimeout,
} from "./mock/index.js"

const composeFunctionAndReturnedFunctions = (...fns) => (...args) => {
  const returnedFns = fns.map((fn) => fn(...args))
  return () => returnedFns.map((returnedFn) => returnedFn())
}

const installFakeHooks = composeFunctionAndReturnedFunctions(
  installFakeAnimationFrame,
  installFakeDate,
  installFakeImmediate,
  installFakeInterval,
  installFakePerformanceNow,
  installFakeProcessHrtime,
  installFakeProcessNextTick,
  installFakeProcessUptime,
  installFakePromise,
  installFakeTimeout,
)

/*
note about helper below : do not try/catch fn(ticker) in order to be sure uninstall() gets called
because when fn throws your application is into an unexpected state, let your app crash
-> in fact I use try finally because it's very important to uninstall setTimeout and stuff like that
when fn() throws because nodejs will then call setTimeout before letting your app crash
*/
export const mockExecution = (fn) => {
  const executionController = createExecutionController()

  const uninstall = installFakeHooks({
    object: typeof window === "object" ? window : global,
    executionController,
  })

  try {
    return fn(executionController)
  } finally {
    uninstall()
  }
}
