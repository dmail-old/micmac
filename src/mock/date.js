import { createFakeInstaller } from "./util.js"

export const installFakeDate = createFakeInstaller(
  ({ at, override, installed, executionController }) =>
    override(at("Date"), (RealDate) => {
      const getRealNow = () => RealDate.now()

      // etFakeNow() check for installed.isOn()
      // and return the fake millisecond or the real millisecond accordingly.
      // instead of this we could also have a sort of clean up method
      // that would be called when mocks are uninstalled
      const getFakeNow = () =>
        installed.isOn() ? executionController.getNano().getMillisecond() : getRealNow()

      function FakeDate(...args) {
        // eslint-disable-line no-inner-declarations
        if (args.length === 0) {
          return new RealDate(getFakeNow())
        }
        return new RealDate(...args)
      }

      const overrides = {
        now: getFakeNow,
      }

      Object.getOwnPropertyNames(RealDate).forEach((name) => {
        const descriptor = Object.getOwnPropertyDescriptor(RealDate, name)
        if (descriptor.configurable) {
          if (name in overrides) {
            descriptor.value = overrides[name]
          }
          Object.defineProperty(FakeDate, name, descriptor)
        }
      })

      return {
        fake: FakeDate,
        controlMethods: {
          getRealNow,
          getFakeNow,
        },
      }
    }),
)
