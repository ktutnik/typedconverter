import { Class } from "./types"

// --------------------------------------------------------------------- //
// ------------------------------- TYPES ------------------------------- //
// --------------------------------------------------------------------- //

type Converter = (value: {}) => {} | undefined

// --------------------------------------------------------------------- //
// ------------------------------- HELPER ------------------------------ //
// --------------------------------------------------------------------- //

//some object can't simply convertible to string https://github.com/emberjs/ember.js/issues/14922#issuecomment-278986178
function safeToString(value: any) {
    try {
        return value.toString()
    } catch (e) {
        return "[object Object]"
    }
}


// --------------------------------------------------------------------- //
// ----------------------------- CONVERTERS ---------------------------- //
// --------------------------------------------------------------------- //

function booleanConverter(rawValue: {}) {
    const value = safeToString(rawValue)
    const list: { [key: string]: boolean | undefined } = {
        on: true, true: true, "1": true, yes: true,
        off: false, false: false, "0": false, no: false
    }
    return list[value.toLowerCase()]
}

function numberConverter(rawValue: {}) {
    const value = safeToString(rawValue)
    const result = Number(value)
    return isNaN(result) ? undefined : result
}

function dateConverter(rawValue: {}) {
    const value = safeToString(rawValue)
    const stamp = Date.parse(value)
    return isNaN(stamp) ? undefined : new Date(stamp)
}

const defaultConverters = new Map<Class, Converter>([
    [Boolean, booleanConverter],
    [Date, dateConverter],
    [Number, numberConverter]
])

export { defaultConverters, Converter, safeToString }
