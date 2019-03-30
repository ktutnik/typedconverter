import reflect from "tinspector"

// --------------------------------------------------------------------- //
// ------------------------------- TYPES ------------------------------- //
// --------------------------------------------------------------------- //

type Class = new (...args: any[]) => any
interface ConverterMap { key: Function, converter: Converter }

type Converter = (value: any, path: string[], expectedType: Function | Function[], converters: Map<Function, Converter>) => any

class ConversionError extends Error {
    constructor(public issues: { path: string[], messages: string[] }, public status = 400) {
        super()
        Object.setPrototypeOf(this, ConversionError.prototype)
    }
}

// --------------------------------------------------------------------- //
// ------------------------------- HELPER ------------------------------ //
// --------------------------------------------------------------------- //

function createConversionError(value: any, typ: Function | Function[], path: string[]) {
    const typeName = Array.isArray(typ) ? `Array<${typ[0].name}>` : typ.name
    return new ConversionError({ path: path, messages: [`Unable to convert "${value}" into ${typeName}`] })
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
    export function booleanConverter(rawValue: {}, path: string[]) {
        const value: string = safeToString(rawValue)
        const list: { [key: string]: boolean | undefined } = {
            on: true, true: true, "1": true, yes: true,
            off: false, false: false, "0": false, no: false
        }
        const result = list[value.toLowerCase()]
        if (result === undefined) throw createConversionError(value, Boolean, path)
        return result
    }

    export function numberConverter(rawValue: {}, path: string[]) {
        const value = safeToString(rawValue)
        const result = Number(value)
        if (isNaN(result) || value === "") throw createConversionError(value, Number, path)
        return result
    }

    export function dateConverter(rawValue: {}, path: string[]) {
        const value = safeToString(rawValue)
        const result = new Date(value)
        if (isNaN(result.getTime()) || value === "") throw createConversionError(value, Date, path)
        return result
    }

    export function modelConverter(value: {}, path: string[], expectedType: Function | Function[], converters: Map<Function, Converter>): any {
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
        if (!isConvertibleToObject(value)) throw createConversionError(value, TheType, path)
        const instance = createInstance(value, TheType)
        //traverse through the object properties and convert to appropriate property's type
        //sanitize excess property to prevent object having properties that doesn't match with declaration
        for (let x of reflection.properties) {
            const val = convert((value as any)[x.name], path.concat(x.name), x.type, converters)
            //remove undefined properties
            if (val === undefined) delete instance[x.name]
            else instance[x.name] = val
        }
        return instance;
    }

    export function arrayConverter(value: {}[], path: string[], expectedType: Function[], converters: Map<Function, Converter>): any {
        if (!Array.isArray(value)) throw createConversionError(value, expectedType, path)
        return value.map((x, i) => convert(x, path.concat(i.toString()), expectedType[0], converters))
    }
}

// --------------------------------------------------------------------- //
// --------------------------- MAIN CONVERTER -------------------------- //
// --------------------------------------------------------------------- //

function convert(value: any, path: string[], expectedType: Function | Function[] | undefined, converters: Map<Function, Converter>) {
    if (value === null || value === undefined) return undefined
    if (!expectedType) return value
    if (expectedType === Object) return value;
    if (value.constructor === expectedType) return value;
    //check if the parameter contains @array()
    if (Array.isArray(expectedType))
        return DefaultConverters.arrayConverter(value, path, expectedType, converters)
    //check if parameter is native value that has default converter (Number, Date, Boolean) or if user provided converter
    else if (converters.has(expectedType))
        return converters.get(expectedType)!(value, path, expectedType, converters)
    //if type of model and has no  converter, use DefaultObject converter
    else
        return DefaultConverters.modelConverter(value, path, expectedType as Class, converters)
}

function converter(option: { type?: Function | Function[], converters?: ConverterMap[] } = {}) {
    return (value: any, type?: Function | Function[], path: string[] = []) => {
        const mergedConverters: Map<Function, Converter> = new Map()
        mergedConverters.set(Number, DefaultConverters.numberConverter)
        mergedConverters.set(Boolean, DefaultConverters.booleanConverter)
        mergedConverters.set(Date, DefaultConverters.dateConverter);
        (option.converters || []).forEach(x => mergedConverters.set(x.key, x.converter))
        return convert(value, path, type || option.type, mergedConverters)
    }
}

export { Converter, DefaultConverters, ConverterMap, ConversionError }
export default converter