import reflect, { decorateProperty, decorate, mergeDecorator } from "tinspector";
import { VisitorInvocation } from './invocation';
import { Result } from './visitor';
import { Class } from './types';
import { safeToString } from './converter';

const OptionalValidator = Symbol("tc:optional")
const PartialValidator = Symbol("tc:partial")
type Validator = (val: any) => string | undefined
interface ValidatorDecorator { type: "tc:validator", validator: Validator | string | symbol }

function createValidation(validator: Validator | string | symbol) {
    return decorateProperty(<ValidatorDecorator>{ type: "tc:validator", validator })
}

function optional() {
    return createValidation(OptionalValidator)
}

function partial(type: Class) {
    return mergeDecorator(reflect.type(type, "Partial"), createValidation(PartialValidator))
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

function getValidators(i: VisitorInvocation): ValidatorDecorator[] {
    return i.decorators
        .filter((x: ValidatorDecorator) => x.validator !== OptionalValidator
            && x.validator !== PartialValidator && x.type === "tc:validator")
}

function validatorVisitor(i: VisitorInvocation): Result {
    const validators = getValidators(i)
    if (validators.length > 0) {
        const result = i.proceed()
        const messages: string[] = []
        for (const validator of validators) {
            if (typeof validator.validator === "function") {
                const msg = validator.validator(safeToString(i.value))
                if (msg) messages.push(msg)
            }
        }
        return messages.length > 0 ? Result.error(i.path, messages) : result
    }
    else
        return i.proceed()
}

export { createValidation, optional, partial, requiredValidationVisitor, validatorVisitor, Validator, ValidatorDecorator, OptionalValidator, PartialValidator }
