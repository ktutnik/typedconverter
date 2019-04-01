import reflect, { decorate } from "tinspector"

// --------------------------------------------------------------------- //
// ------------------------------- TYPES ------------------------------- //
// --------------------------------------------------------------------- //

type Class = new (...args: any[]) => any
type ConverterMap = [Function | string, Converter]
interface ConversionIssue { path: string[], messages: string[] }
type ConversionResult = [any, ConversionIssue[] | undefined]
type ConverterStore = Map<Function | string, Converter>
interface ObjectInfo<T> {
    path: string[],
    expectedType: T,
    converters: ConverterStore
}

type Converter = (value: any, info: ObjectInfo<Function | Function[]>) => ConversionResult

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
    export function booleanConverter(rawValue: {}, info: ObjectInfo<Function | Function[]>): ConversionResult {
        const value: string = safeToString(rawValue)
        const list: { [key: string]: boolean | undefined } = {
            on: true, true: true, "1": true, yes: true,
            off: false, false: false, "0": false, no: false
        }
        const result = list[value.toLowerCase()]
        if (result === undefined) return [undefined, createConversionError(value, Boolean, info.path)]
        return [result, undefined]
    }

    export function numberConverter(rawValue: {}, info: ObjectInfo<Function | Function[]>): ConversionResult {
        const value = safeToString(rawValue)
        const result = Number(value)
        if (isNaN(result) || value === "") return [undefined, createConversionError(value, Number, info.path)]
        return [result, undefined]
    }

    export function dateConverter(rawValue: {}, info: ObjectInfo<Function | Function[]>): ConversionResult {
        const value = safeToString(rawValue)
        const result = new Date(value)
        if (isNaN(result.getTime()) || value === "") return [undefined, createConversionError(value, Date, info.path)]
        return [result, undefined]
    }

    export function modelConverter(value: {}, info: ObjectInfo<Function | Function[]>): ConversionResult {
        const { converters } = info
        //--- helper functions
        const isConvertibleToObject = (value: any) =>
            typeof value !== "boolean"
            && typeof value !== "number"
            && typeof value !== "string"
        //---
        const TheType = info.expectedType as Class
        //get reflection metadata of the class
        const reflection = reflect(TheType)
        //check if the value is possible to convert to model
        if (!isConvertibleToObject(value)) return [undefined, createConversionError(value, TheType, info.path)]
        const instance = createInstance(value, TheType)
        //traverse through the object properties and convert to appropriate property's type
        //sanitize excess property to prevent object having properties that doesn't match with declaration
        const issues: ConversionIssue[] = []
        for (let x of reflection.properties) {
            const [val, err] = convert((value as any)[x.name], {
                path: info.path.concat(x.name),
                expectedType: x.type,
                converters
            })
            if (err) issues.push(...err)
            //remove undefined properties
            if (val === undefined) delete instance[x.name]
            else instance[x.name] = val
        }
        if (issues.length > 0) return [undefined, issues]
        else return [instance, undefined]
    }

    function arrayConverter(value: {}[], info: ObjectInfo<Function[]>): ConversionResult {
        const result = value.map((x, i) => convert(x, {
            path: info.path.concat(i.toString()),
            expectedType: info.expectedType && info.expectedType[0],
            converters: info.converters
        }))
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

    export function strictArrayConverter(value: {}, info: ObjectInfo<Function[]>): ConversionResult {
        if (!Array.isArray(value)) return [undefined, createConversionError(value, info.expectedType, info.path)]
        return arrayConverter(value, info)
    }

    export function friendlyArrayConverter(value: {}, info: ObjectInfo<Function[]>): ConversionResult {
        const cleanValue = Array.isArray(value) ? value : [value]
        return arrayConverter(cleanValue, info)
    }
}

// --------------------------------------------------------------------- //
// --------------------------- MAIN CONVERTER -------------------------- //
// --------------------------------------------------------------------- //

function convert(value: any, info: ObjectInfo<Function | Function[] | undefined>): ConversionResult {
    const { expectedType, converters, path } = info
    if (value === null || value === undefined) return [undefined, undefined]
    if (!expectedType) return [value, undefined]
    if (expectedType === Object) return [value, undefined]
    if (value.constructor === expectedType) return [value, undefined]
    //check if the parameter contains @array()
    if (Array.isArray(expectedType))
        return converters.get("Array")!(value, { expectedType, converters, path })
    //check if parameter is native value that has default converter (Number, Date, Boolean) or if user provided converter
    else if (converters.has(expectedType))
        return converters.get(expectedType)!(value, { expectedType, converters, path })
    //if type of model and has no  converter, use DefaultObject converter
    else
        return converters.get("Model")!(value, { expectedType, converters, path })
}

function converter(option: { guessArrayElement?: boolean, type?: Function | Function[], converters?: ConverterMap[] } = {}) {
    return (value: any, type?: Function | Function[], path: string[] = []) => {
        const arrayConverter = <Converter>(option.guessArrayElement ? DefaultConverters.friendlyArrayConverter : DefaultConverters.strictArrayConverter)
        const mergedConverters: ConverterStore = new Map<Function | string, Converter>([
            [Number, DefaultConverters.numberConverter],
            [Boolean, DefaultConverters.booleanConverter],
            [Date, DefaultConverters.dateConverter],
            ["Array", arrayConverter],
            ["Model", DefaultConverters.modelConverter],
            ...option.converters || []
        ]);
        const [val, err] = convert(value, { path, expectedType: type || option.type, converters: mergedConverters })
        if (err) throw new ConversionError(err)
        else return val
    }
}

export {
    Converter, DefaultConverters, ConverterMap, ConversionResult,
    ConversionError, ObjectInfo, ConversionIssue, ConverterStore
}

export default converter