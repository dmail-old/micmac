import { createFakeInstaller } from "./util.js"

export const installFakePerformanceNow = createFakeInstaller(
  ({ at, override, executionController }) =>
    override(at("performance", "now"), (performanceNow) => {
      const getRealPerformanceNow = () => performanceNow()

      const getFakePerformanceNow = () =>
        executionController
          .getNano()
          .getMillisecondFloat()
          .toFixed(4)

      return {
        fake: getFakePerformanceNow,
        controlMethods: {
          getRealPerformanceNow,
          getFakePerformanceNow,
        },
      }
    }),
)
