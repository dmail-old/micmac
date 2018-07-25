import { convertSecondToMillisecond, createNano } from "../nano.js"
import { createFakeInstaller } from "./util.js"

export const installFakeProcessHrtime = createFakeInstaller(
  ({ at, override, executionController }) =>
    override(at("process", "hrtime"), (processHrtime) => {
      const createNanoFromSecondAndNanosecond = ([second, nanosecond]) => {
        return createNano({
          millisecond: convertSecondToMillisecond(second),
          nanosecond,
        })
      }

      const getRealHrtime = () => processHrtime()

      const getFakeHrtime = (time) => {
        const nano = executionController.getNano()
        if (time) {
          const timeNano = createNanoFromSecondAndNanosecond(time)
          const diffNano = nano.minus(timeNano)
          return [diffNano.getSecondFloat(), diffNano.getNanosecond()]
        }
        return [nano.getSecondFloat(), nano.getNanosecond()]
      }

      return {
        fake: getFakeHrtime,
        controlMethods: {
          getRealHrtime,
          getFakeHrtime,
        },
      }
    }),
)
