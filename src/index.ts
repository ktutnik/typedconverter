import { Opt, val } from "./decorators"
import { VisitorExtension, VisitorInvocation } from "./invocation"
import { transform } from "./transformer"
import { Class } from "./types"
import {
    optional,
    OptionalValidator,
    partial,
    PartialValidator,
    requiredValidationVisitor,
    Validator,
    validatorVisitor,
    ValidatorDecorator
} from "./validation"
import { pipeline, Result, ResultMessages } from "./visitor"

interface Option {
    /**
     * Expected type
     */
    type: Class | Class[],

    /**
     * List of visitor extension to extend TypedConverter internal process
     */
    visitors?: VisitorExtension[]

    /**
     * Top decorators of the type
     */
    decorators?: any[],

    /**
     * Root path
     */
    path?: string,

    /**
     * Guess single value as array element if expected type is array. Default false
     */
    guessArrayElement?: boolean
}

/**
 * Convert value into type specified on configuration.
 * @param value 
 * @param opt 
 */
function convert(value: any, opt: Option) {
    return pipeline(value, transform(opt.type), {
        path: opt.path || "", extension: opt.visitors || [],
        decorators: opt.decorators || [],
        guessArrayElement: opt.guessArrayElement || false
    })
}

/**
 * Create type converter with specific configuration
 * @param option 
 */
export default function createConverter(option: Option) {
    return (value: any) => convert(value, option)
}

function validate(value: any, opt: Option) {
    const visitors = [requiredValidationVisitor, validatorVisitor]
    for (const visitor of (opt.visitors || [])) {
        visitors.push(visitor)
    }
    return convert(value, { 
        decorators: opt.decorators, guessArrayElement: opt.guessArrayElement, 
        path: opt.path, type: opt.type, visitors
    })
}

export {
    convert, Option, VisitorExtension,
    VisitorInvocation, Result, ResultMessages,
    optional, partial, requiredValidationVisitor, validatorVisitor, Validator,
    OptionalValidator, PartialValidator, val, Opt, validate, ValidatorDecorator
}