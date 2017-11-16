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
		off
	}
}

export const composeFunction = (a, b) => (...args) => {
	a(...args)
	b(...args)
}

export const composeFunctionAndReturnedFunctions = (...fns) => (...args) => {
	const returnedFns = fns.map(fn => fn(...args))
	return () => returnedFns.map(returnedFn => returnedFn())
}

export const createPropertyHelpers = object => {
	const hasProperty = name => object.hasOwnProperty(name)
	const getProperty = name => object[name]
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
		set: setProperty
	}
}

export const createFakeInstaller = installer => {
	const installed = createToggle(false)

	return ({ object, executionController }) => {
		if (installed.isOn()) {
			throw new Error("already installed")
		}
		installed.on()
		let restore = () => installed.off()

		const addRestorer = fn => {
			restore = composeFunction(restore, fn)
		}
		const mock = (instruction, where) => {
			const { fake, changed } = instruction

			addRestorer(where.set(where.name, fake))
			if (changed) {
				// bon du coup c'est plus complexe que je croyais non?
				// lorsque je tick() je reçois un nano du temps qu'il est actuellement
				// lorsque je tickAbsolute même chose
				// mais cette valeur est relative à un temps local (par défaut 0)
				// et je veux synchroniser les deux donc en gros lorsque je modifie le temps global
				// je veux répercuter sur le temps local
				// il se peut que: je revienne en arrière (ah bon?), je reset, j'avance
				// hum.... j'ai pas envie d'autoriser à reset/revenir en arrière pour le moment
				let currentNano = executionController.getNano()
				executionController.listenNano(() => {
					const nano = executionController.getNano()
					const previousNano = currentNano
					currentNano = nano
					changed(previousNano, nano)
				})
			}
		}
		const getHowParams = where => where.get(where.name)
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

			if (wheres.some(where => where === null)) {
				return
			}
			const instructions = how(...wheres.map(where => getHowParams(where)))
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
				name
			}
		}
		installer({
			at,
			override,
			composeOverride,
			executionController,
			installed
		})
		return restore
	}
}

export const createSetCancelPairs = fnReturningCancel => {
	let previousId = 0
	const cancellerIds = {}

	const set = (...args) => {
		const id = previousId + 1
		previousId = id
		cancellerIds[id] = fnReturningCancel(...args)
		return id
	}
	const cancel = id => {
		if (id in cancellerIds) {
			cancellerIds[id]()
			delete cancellerIds[id]
		}
	}
	return { set, cancel }
}
