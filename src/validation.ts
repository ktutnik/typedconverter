import reflect, { decorateProperty, decorate, mergeDecorator } from "tinspector";
import { VisitorInvocation } from './invocation';
import { Result } from './visitor';
import { Class } from './types';

const OptionalValidator = Symbol("tc:optional")
const PartialValidator = Symbol("tc:partial")
type Validator = (val: any) => string | undefined
interface ValidatorDecorator { type: "tc:validator", validator: Validator | string | symbol }

function validate(validator: Validator | string | symbol) {
    return decorateProperty(<ValidatorDecorator>{ type: "tc:validator", validator })
}

function optional() {
    return validate(OptionalValidator)
}

function partial(type: Class) {
    return mergeDecorator(reflect.type(type, "Partial"), validate(PartialValidator))
}

/**
 * When registered to the converter, this visitor will make all variable or properties required by default, except optional decorator added
 * @param i Visitor invocation
 */
function requiredValidationVisitor(i: VisitorInvocation): Result {
    const result = i.proceed()
    const isEmpty = () => (result.value === undefined || result.value === null) && result.issues === undefined
    const isOptional = () => i.decorators.find((x: ValidatorDecorator) => x.validator === OptionalValidator)
    const isPartial = () => i.parent && i.parent.decorators.find((x:ValidatorDecorator) => x.validator === PartialValidator)
    if (isEmpty() && !isOptional() && !isPartial())
        return Result.error(i.path, `Required`)
    else
        return result;
}

export { validate, optional, partial, requiredValidationVisitor, Validator, ValidatorDecorator, OptionalValidator, PartialValidator }
