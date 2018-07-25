import { createFakeInstaller } from "./util.js"

export const installFakeProcessUptime = createFakeInstaller(
  ({ at, override, executionController }) =>
    override(at("process", "uptime"), (processUptime) => {
      const getRealUptime = () => processUptime()

      const getFakeUptime = () => executionController.getNano().getSecondFloat()

      return {
        fake: getFakeUptime,
        controlMethods: {
          getRealUptime,
          getFakeUptime,
        },
      }
    }),
)
