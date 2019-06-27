import { VisitorExtension, VisitorInvocation } from "./invocation"
import { transform } from "./transformer"
import { Class } from "./types"
import {
    optional,
    OptionalValidator,
    partial,
    PartialValidator,
    requiredValidationVisitor,
    validate,
    Validator,
    ValidatorDecorator,
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
    path?: string
}

/**
 * Convert value into type specified on configuration.
 * @param value 
 * @param opt 
 */
function convert(value: any, opt: Option) {
    return pipeline(value, transform(opt.type), opt.path || "", opt.visitors || [], opt.decorators || [])
}

/**
 * Create type converter with specific configuration
 * @param option 
 */
export default function createConverter(option: Option) {
    return (value: any) => convert(value, option)
}

export {
    convert, Option, VisitorExtension,
    VisitorInvocation, Result, ResultMessages, validate,
    optional, partial, requiredValidationVisitor, Validator,
    ValidatorDecorator, OptionalValidator, PartialValidator
}