import reflect, { decorate } from "tinspector"

// --------------------------------------------------------------------- //
// ------------------------------- TYPES ------------------------------- //
// --------------------------------------------------------------------- //

type Class = new (...args: any[]) => any
type ConverterMap = [Function | string, Converter]
type Converter = (value: any, info: ObjectInfo<Function | Function[]>) => Promise<ConversionResult>
type Visitor = (value: any, invocation: ConverterInvocation) => Promise<ConversionResult>
type ConverterStore = Map<Function | string, Converter>
interface FactoryOption { guessArrayElement?: boolean, type?: Function | Function[], converters?: ConverterMap[], visitors?: Visitor[] }
interface ConverterOption { type?: Function | Function[], path?: string[], decorators?: any[] }

interface ObjectInfo<T> {
    type: T,
    path: string[],
    converters: ConverterStore,
    visitors: Visitor[],
    decorators: any[],
}

class ConversionResult {
    value: any;
    messages: ConversionMessage[] = []
    constructor(value?: {} | ConversionMessage) {
        if (value instanceof ConversionMessage)
            this.messages.push(value)
        else
            this.value = value
    }

    merge(obj: ConversionResult | ConversionMessage) {
        const result = new ConversionResult()
        result.value = obj instanceof ConversionResult ? obj.value : this.value
        result.messages = mergeIssue(this.messages, obj instanceof ConversionResult ? obj.messages : [obj])
        return result;
    }
}

class ConversionMessage {
    messages: string[]
    constructor(public path: string[], message: string) {
        this.messages = [message]
    }
}

class ConversionError extends Error {
    constructor(public issues: ConversionMessage[], public status = 400) {
        super(issues.map(x => `${x.path.join(".")} ${x.messages.join(", ")}`).join("\n"))
        Object.setPrototypeOf(this, ConversionError.prototype)
    }
}


// --------------------------------------------------------------------- //
// ----------------------------- INVOCATION ---------------------------- //
// --------------------------------------------------------------------- //

abstract class ConverterInvocation implements ObjectInfo<Function | Function[]> {
    type: Function | Function[]
    path: string[]
    converters: Map<string | Function, Converter>
    visitors: Visitor[]
    decorators: any[]
    constructor(info: ObjectInfo<Function | Function[]>) {
        this.type = info.type
        this.path = info.path
        this.converters = info.converters
        this.visitors = info.visitors
        this.decorators = info.decorators
    }
    abstract proceed(): Promise<ConversionResult>
}

class VisitorInvocation extends ConverterInvocation {
    private next?: ConverterInvocation
    constructor(private visitor: Visitor, private value: any, info: ObjectInfo<Function | Function[]>) {
        super(info)
    }
    chain(next: ConverterInvocation): ConverterInvocation {
        this.next = next
        return this
    }
    proceed(): Promise<ConversionResult> {
        return this.visitor(this.value, this.next!)
    }
}

class MainInvocation extends ConverterInvocation {
    constructor(private value: any, info: ObjectInfo<Function | Function[]>) {
        super(info)
    }
    proceed(): Promise<ConversionResult> {
        return visitor(this.value, this)
    }
}

function pipe(value: any, info: ObjectInfo<Function | Function[]>) {
    const invocations = info.visitors.map(x => new VisitorInvocation(x, value, { ...info }))
    return invocations.reduce((a, b) => b.chain(a), <ConverterInvocation>new MainInvocation(value, { ...info })).proceed()
}

// --------------------------------------------------------------------- //
// ------------------------------- HELPER ------------------------------ //
// --------------------------------------------------------------------- //

function createMessage(value: any, typ: Function | Function[], path: string[]): ConversionResult {
    const typeName = Array.isArray(typ) ? `Array<${typ[0].name}>` : typ.name
    const message = new ConversionMessage(path, `Unable to convert "${value}" into ${typeName}`)
    return new ConversionResult(message)
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

function mergeIssue(prevResult: ConversionMessage[], curResult: ConversionMessage[] | ConversionMessage) {
    const temp = prevResult.concat(curResult)
    const result: ConversionMessage[] = []
    const map: { [key: string]: ConversionMessage } = {}
    for (const item of temp) {
        const savedItem = map[item.path.join(".")]
        if (savedItem) {
            savedItem.messages.push(...item.messages)
        }
        else {
            map[item.path.join(".")] = item
            result.push(item)
        }
    }
    return result;
}

// --------------------------------------------------------------------- //
// ------------------------- DEFAULT CONVERTERS ------------------------ //
// --------------------------------------------------------------------- //

namespace DefaultConverters {
    export async function booleanConverter(rawValue: {}, info: ObjectInfo<Function | Function[]>): Promise<ConversionResult> {
        const value: string = safeToString(rawValue)
        const list: { [key: string]: boolean | undefined } = {
            on: true, true: true, "1": true, yes: true,
            off: false, false: false, "0": false, no: false
        }
        const result = list[value.toLowerCase()]
        if (result === undefined) return createMessage(value, Boolean, info.path)
        return new ConversionResult(result)
    }

    export async function numberConverter(rawValue: {}, info: ObjectInfo<Function | Function[]>): Promise<ConversionResult> {
        const value = safeToString(rawValue)
        const result = Number(value)
        if (isNaN(result) || value === "") return createMessage(value, Number, info.path)
        return new ConversionResult(result)
    }

    export async function dateConverter(rawValue: {}, info: ObjectInfo<Function | Function[]>): Promise<ConversionResult> {
        const value = safeToString(rawValue)
        const result = new Date(value)
        if (isNaN(result.getTime()) || value === "") return createMessage(value, Date, info.path)
        return new ConversionResult(result)
    }

    export async function classConverter(value: {}, { type, path, ...restInfo }: ObjectInfo<Function | Function[]>): Promise<ConversionResult> {
        //--- helper functions
        const isConvertibleToObject = (value: any) =>
            typeof value !== "boolean"
            && typeof value !== "number"
            && typeof value !== "string"
        //---
        const TheType = type as Class
        //get reflection metadata of the class
        const reflection = reflect(TheType)
        //check if the value is possible to convert to model
        if (!isConvertibleToObject(value)) return createMessage(value, TheType, path)
        const instance = createInstance(value, TheType)
        //traverse through the object properties and convert to appropriate property's type
        //sanitize excess property to prevent object having properties that doesn't match with declaration
        const result = new ConversionResult(instance)
        for (let x of reflection.properties) {
            const propResult = await convert((value as any)[x.name], {
                path: path.concat(x.name),
                type: x.type,
                ...restInfo,
                decorators: x.decorators
            })
            if (propResult.messages.length > 0) result.messages = mergeIssue(result.messages, propResult.messages)
            //remove undefined properties
            if (propResult.value === undefined) delete instance[x.name]
            else instance[x.name] = propResult.value
        }
        return result
    }

    async function arrayConverter(value: {}[], { type, path, ...restInfo }: ObjectInfo<Function[]>): Promise<ConversionResult> {
        const result = await Promise.all(value.map((x, i) => convert(x, {
            path: path.concat(i.toString()),
            type: type[0],
            ...restInfo
        })))
            const returnedResult = new ConversionResult(result.map(x => x.value))
            const issue: ConversionMessage[] = []
            for (const item of result) {
                if (item.messages.length > 0) returnedResult.messages = mergeIssue(returnedResult.messages, item.messages)
            }
            return returnedResult
    }

    export async function strictArrayConverter(value: {}, info: ObjectInfo<Function[]>): Promise<ConversionResult> {
        if (!Array.isArray(value)) return createMessage(value, info.type, info.path)
        return arrayConverter(value, info)
    }

    export async function friendlyArrayConverter(value: {}, info: ObjectInfo<Function[]>): Promise<ConversionResult> {
        const cleanValue = Array.isArray(value) ? value : [value]
        return arrayConverter(cleanValue, info)
    }
}

// --------------------------------------------------------------------- //
// --------------------------- MAIN CONVERTER -------------------------- //
// --------------------------------------------------------------------- //

async function visitor(value: any, { type, converters, ...restInfo }: ObjectInfo<Function | Function[]>): Promise<ConversionResult> {
    if (type === Object || value.constructor === type) return new ConversionResult(value)
    //check if the parameter contains @array()
    if (Array.isArray(type))
        return converters.get("Array")!(value, { type, converters, ...restInfo })
    //check if parameter is native value that has default converter (Number, Date, Boolean) or if user provided converter
    else if (converters.has(type))
        return converters.get(type)!(value, { type, converters, ...restInfo })
    //if type of model and has no  converter, use DefaultObject converter
    else
        return converters.get("Class")!(value, { type, converters, ...restInfo })
}

async function convert(value: any, { type, ...restInfo }: ObjectInfo<Function | Function[] | undefined>): Promise<ConversionResult> {
    if (value === null || value === undefined || !type) return new ConversionResult(value)
    return pipe(value, { type, ...restInfo })
}

function converter(factoryOption: FactoryOption = {}) {
    return async (value: any, option?: Function | Function[] | ConverterOption) => {
        const { friendlyArrayConverter: friendly, strictArrayConverter: strict } = DefaultConverters
        const mergedConverters: ConverterStore = new Map<Function | string, Converter>([
            [Number, DefaultConverters.numberConverter],
            [Boolean, DefaultConverters.booleanConverter],
            [Date, DefaultConverters.dateConverter],
            ["Array", <Converter>(factoryOption.guessArrayElement ? friendly : strict)],
            ["Class", DefaultConverters.classConverter],
            ...factoryOption.converters || []
        ]);
        const expectedType = Array.isArray(option) || typeof option === "function" ? option : option && option.type
        const path = typeof option === "object" && !Array.isArray(option) && option.path || []
        const decorators = typeof option === "object" && !Array.isArray(option) && option.decorators || []
        const result = await convert(value, {
            path, type: expectedType || factoryOption.type,
            converters: mergedConverters,
            visitors: factoryOption.visitors || [],
            decorators
        })
        if (result.messages.length > 0) throw new ConversionError(result.messages)
        else return result.value
    }
}

export {
    Converter, DefaultConverters, ConverterMap, ConversionResult,
    ConversionError, ObjectInfo, ConversionMessage, ConverterStore, Visitor,
    FactoryOption, ConverterOption, ConverterInvocation
}

export default converter