import reflect, { decorate } from "tinspector"

// --------------------------------------------------------------------- //
// ------------------------------- TYPES ------------------------------- //
// --------------------------------------------------------------------- //

type Class = new (...args: any[]) => any
interface ConverterMap { key: Function, converter: Converter }
interface ConversionIssue { path: string[], messages: string[] }
type ConversionResult = [any, ConversionIssue[] | undefined]
type ConverterStore = Map<Function | string, Converter>

type Converter = (value: any, path: string[], expectedType: Function | Function[], converters: ConverterStore) => ConversionResult

class ConversionError extends Error {
    constructor(public issues: ConversionIssue[], public status = 400) {
        super("Conversion error")
        Object.setPrototypeOf(this, ConversionError.prototype)
    }
}

// --------------------------------------------------------------------- //
// ------------------------------- HELPER ------------------------------ //
// --------------------------------------------------------------------- //

function createConversionError(value: any, typ: Function | Function[], path: string[]): ConversionIssue[] {
    const typeName = Array.isArray(typ) ? `Array<${typ[0].name}>` : typ.name
    return [{ path: path, messages: [`Unable to convert "${value}" into ${typeName}`] }]
}

//some object can't simply convertible to string https://github.com/emberjs/ember.js/issues/14922#issuecomment-278986178
function safeToString(value: any) {
    try {
        return value.toString()
    } catch (e) {
        return "[object Object]"
    }
}

function createInstance<T extends Class>(value: any, TheType: T) {
    try {
        return new TheType()
    }
    catch (e) {
        const message = `Unable to instantiate ${TheType.name}, Expected type should not throw error when instantiate without parameters`
        if (e instanceof Error) {
            e.message = message + "\n" + e.message
            throw e
        }
        else throw new Error(message)
    }
}

// --------------------------------------------------------------------- //
// ------------------------- DEFAULT CONVERTERS ------------------------ //
// --------------------------------------------------------------------- //

namespace DefaultConverters {
    export function booleanConverter(rawValue: {}, path: string[]): ConversionResult {
        const value: string = safeToString(rawValue)
        const list: { [key: string]: boolean | undefined } = {
            on: true, true: true, "1": true, yes: true,
            off: false, false: false, "0": false, no: false
        }
        const result = list[value.toLowerCase()]
        if (result === undefined) return [undefined, createConversionError(value, Boolean, path)]
        return [result, undefined]
    }

    export function numberConverter(rawValue: {}, path: string[]): ConversionResult {
        const value = safeToString(rawValue)
        const result = Number(value)
        if (isNaN(result) || value === "") return [undefined, createConversionError(value, Number, path)]
        return [result, undefined]
    }

    export function dateConverter(rawValue: {}, path: string[]): ConversionResult {
        const value = safeToString(rawValue)
        const result = new Date(value)
        if (isNaN(result.getTime()) || value === "") return [undefined, createConversionError(value, Date, path)]
        return [result, undefined]
    }

    export function modelConverter(value: {}, path: string[], expectedType: Function | Function[], converters: ConverterStore): ConversionResult {
        //--- helper functions
        const isConvertibleToObject = (value: any) =>
            typeof value !== "boolean"
            && typeof value !== "number"
            && typeof value !== "string"
        //---
        const TheType = expectedType as Class
        //get reflection metadata of the class
        const reflection = reflect(TheType)
        //check if the value is possible to convert to model
        if (!isConvertibleToObject(value)) return [undefined, createConversionError(value, TheType, path)]
        const instance = createInstance(value, TheType)
        //traverse through the object properties and convert to appropriate property's type
        //sanitize excess property to prevent object having properties that doesn't match with declaration
        const issues: ConversionIssue[] = []
        for (let x of reflection.properties) {
            const [val, err] = convert((value as any)[x.name], path.concat(x.name), x.type, converters)
            if (err) issues.push(...err)
            //remove undefined properties
            if (val === undefined) delete instance[x.name]
            else instance[x.name] = val
        }
        if (issues.length > 0) return [undefined, issues]
        else return [instance, undefined]
    }

    function arrayConverter(value: {}[], path: string[], expectedType: Function[], converters: ConverterStore): ConversionResult {
        const result = value.map((x, i) => convert(x, path.concat(i.toString()), expectedType[0], converters))
        if (result.some(x => !!x[1])) {
            const issue: ConversionIssue[] = []
            for (const [, err] of result) {
                if (err) issue.push(...err)
            }
            return [undefined, issue]
        }
        else
            return [result.map(x => x[0]), undefined]
    }

    export function strictArrayConverter(value: {}, path: string[], expectedType: Function[], converters: ConverterStore): ConversionResult {
        if (!Array.isArray(value)) return [undefined, createConversionError(value, expectedType, path)]
        return arrayConverter(value, path, expectedType, converters)
    }

    export function friendlyArrayConverter(value: {}, path: string[], expectedType: Function[], converters: ConverterStore): ConversionResult {
        const cleanValue = Array.isArray(value) ? value : [value]
        return arrayConverter(cleanValue, path, expectedType, converters)
    }
}

function validate(validator: (val: any, type: Function) => Promise<undefined | string>) {
    return decorate({ type: "tc:validate", validator })
}

// --------------------------------------------------------------------- //
// --------------------------- MAIN CONVERTER -------------------------- //
// --------------------------------------------------------------------- //

function convert(value: any, path: string[], expectedType: Function | Function[] | undefined, converters: ConverterStore): ConversionResult {
    if (value === null || value === undefined) return [undefined, undefined]
    if (!expectedType) return [value, undefined]
    if (expectedType === Object) return [value, undefined]
    if (value.constructor === expectedType) return [value, undefined]
    //check if the parameter contains @array()
    if (Array.isArray(expectedType))
        return converters.get("Array")!(value, path, expectedType, converters)
    //check if parameter is native value that has default converter (Number, Date, Boolean) or if user provided converter
    else if (converters.has(expectedType))
        return converters.get(expectedType)!(value, path, expectedType, converters)
    //if type of model and has no  converter, use DefaultObject converter
    else
        return converters.get("Model")!(value, path, expectedType as Class, converters)
}

function converter(option: { guessArrayElement?: boolean, type?: Function | Function[], converters?: ConverterMap[] } = {}) {
    return (value: any, type?: Function | Function[], path: string[] = []) => {
        const mergedConverters: ConverterStore = new Map()
        mergedConverters.set(Number, DefaultConverters.numberConverter)
        mergedConverters.set(Boolean, DefaultConverters.booleanConverter)
        mergedConverters.set(Date, DefaultConverters.dateConverter);
        const arrayConverter = <Converter>(option.guessArrayElement ? DefaultConverters.friendlyArrayConverter : DefaultConverters.strictArrayConverter)
        mergedConverters.set("Array", arrayConverter);
        mergedConverters.set("Model", DefaultConverters.modelConverter);
        (option.converters || []).forEach(x => mergedConverters.set(x.key, x.converter))
        const [val, err] = convert(value, path, type || option.type, mergedConverters)
        if (err) throw new ConversionError(err)
        else return val
    }
}

export { Converter, DefaultConverters, ConverterMap, ConversionError, validate }
export default converter