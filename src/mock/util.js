export const createToggle = (value = false) => {
  const isOn = () => value

  const isOff = () => value === false

  const on = () => {
    value = true
  }

  const off = () => {
    value = false
  }

  return {
    isOn,
    isOff,
    on,
    off,
  }
}

export const createPropertyHelpers = (object) => {
  const hasProperty = (name) => object.hasOwnProperty(name)

  const getProperty = (name) => object[name]

  const setProperty = (name, value) => {
    const has = hasProperty(name)
    const old = has ? getProperty(name) : undefined
    object[name] = value
    const restoreProperty = () => {
      if (has) {
        object[name] = old
      } else {
        delete object[name]
      }
    }
    return restoreProperty
  }

  return {
    has: hasProperty,
    get: getProperty,
    set: setProperty,
  }
}

const composeFunction = (a, b) => (...args) => {
  a(...args)
  b(...args)
}

export const createFakeInstaller = (installer) => {
  const installed = createToggle(false)

  return ({ object, executionController }) => {
    if (installed.isOn()) {
      throw new Error("already installed")
    }
    installed.on()

    let restore = () => installed.off()

    const addRestorer = (fn) => {
      restore = composeFunction(restore, fn)
    }

    const mock = (instruction, where) => {
      const { fake, controlMethods } = instruction

      addRestorer(where.set(where.name, fake))
      if (controlMethods) {
        Object.assign(executionController, controlMethods)
      }
    }

    const getHowParams = (where) => where.get(where.name)

    const override = (where, how) => {
      if (where === null) {
        return
      }
      const instruction = how(getHowParams(where))
      mock(instruction, where)
    }

    const composeOverride = (...args) => {
      const how = args.pop()
      const wheres = args

      if (wheres.some((where) => where === null)) {
        return
      }
      const instructions = how(...wheres.map((where) => getHowParams(where)))
      wheres.forEach((where, index) => mock(instructions[index], where))
    }

    const at = (...names) => {
      if (names.length === 0) {
        throw new Error("one name expected")
      }
      let i = 0
      let { has, get, set } = createPropertyHelpers(object)
      let name
      while (i < names.length) {
        name = names[i]
        if (has(name) === false) {
          return null
        } else if (i === names.length - 1) {
          break
        }
        ;({ has, get, set } = createPropertyHelpers(get(name)))
        i++
      }

      return {
        has,
        get,
        set,
        name,
      }
    }

    installer({
      at,
      override,
      composeOverride,
      executionController,
      installed,
    })

    return restore
  }
}

export const createSetCancelPairs = (fnReturningCancel) => {
  let previousId = 0
  const cancellerIds = {}

  const set = (...args) => {
    const id = previousId + 1
    previousId = id
    cancellerIds[id] = fnReturningCancel(...args)
    return id
  }

  const cancel = (id) => {
    if (id in cancellerIds) {
      cancellerIds[id]()
      delete cancellerIds[id]
    }
  }

  return { set, cancel }
}
