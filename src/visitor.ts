import reflect from "tinspector"

import { ArrayNode, ObjectNode, PrimitiveNode, SuperNode } from "./transformer"
import { safeToString } from './converter';
import { VisitorExtension, pipe } from './invocation';
import { isArray } from 'util';
import { Class } from './types';

// --------------------------------------------------------------------- //
// ------------------------------- TYPES ------------------------------- //
// --------------------------------------------------------------------- //

interface ResultMessages {
    path: string,
    messages: string[]
}

interface Result {
    value: any,
    issues?: ResultMessages[]
}

namespace Result {
    export function create(value: any): Result {
        return { value }
    }
    export function error(path: string, message: string | string[]): Result {
        return { value: undefined, issues: [{ path, messages: Array.isArray(message) ? message : [message] }] }
    }
}


// --------------------------------------------------------------------- //
// ------------------------------ HELPER ------------------------------- //
// --------------------------------------------------------------------- //

function getPath(path: string, name: string) {
    return path.length === 0 ? name : `${path}.${name}`
}

const visitorMap = {
    "Primitive": primitiveVisitor,
    "Array": arrayVisitor,
    "Object": objectVisitor,
}


function unableToConvert(value: {}, type: string) {
    return `Unable to convert "${safeToString(value)}" into ${type}`
}

// --------------------------------------------------------------------- //
// ------------------------------ VISITORS ----------------------------- //
// --------------------------------------------------------------------- //

function primitiveVisitor(value: {}, ast: PrimitiveNode, path: string, extension: VisitorExtension[], decorators: any[]): Result {
    const result = ast.converter(value)
    if (result === undefined)
        return Result.error(path, unableToConvert(value, ast.type.name))
    else
        return Result.create(result)
}

function arrayVisitor(value: {}[], ast: ArrayNode, path: string, extension: VisitorExtension[], decorators: any[]): Result {
    const newValues = Array.isArray(value) ? value : [value]
    const result: any[] = []
    const errors: ResultMessages[] = []
    for (let i = 0; i < newValues.length; i++) {
        const val = value[i];
        const elValue = pipeline(val, ast.element as SuperNode, getPath(path, i.toString()), extension, decorators)
        result.push(elValue.value)
        if (elValue.issues)
            errors.push(...elValue.issues)
    }
    return { value: result, issues: errors.length === 0 ? undefined : errors }
}

function objectVisitor(value: any, ast: ObjectNode, path: string, extension: VisitorExtension[], decorators: any[]): Result {
    if (typeof value === "number" || typeof value === "string" || typeof value === "boolean")
        return Result.error(path, unableToConvert(value, ast.type.name))
    const instance = Object.create(ast.type.prototype)
    const meta = reflect(ast.type)
    const errors: ResultMessages[] = []
    for (const property of meta.properties) {
        const node = ast.properties.get(property.name) as SuperNode
        const propValue = pipeline(value[property.name], node, getPath(path, property.name), extension, property.decorators)
        if (propValue.value !== undefined)
            instance[property.name] = propValue.value
        if (propValue.issues)
            errors.push(...propValue.issues)
    }
    return { value: instance, issues: errors.length === 0 ? undefined : errors }
}

function visitor(value: any, ast: SuperNode, path: string, extension: VisitorExtension[], decorators: any[]): Result {
    if (value === undefined || value === null || value.constructor === ast.type || ast.type === Object) return { value }
    return visitorMap[ast.kind](value, ast as any, path, extension, decorators)
}

function pipeline(value: any, ast: SuperNode, path: string, extension: VisitorExtension[], decorators: any[]): Result {
    const visitors = pipe(value, path, ast, decorators, extension, () => visitor(value, ast as any, path, extension, decorators))
    return visitors.proceed()
}

export { pipeline, ResultMessages, Result }