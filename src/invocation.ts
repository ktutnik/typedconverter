import { Result } from "./visitor";
import { SuperNode } from './transformer';
import { Class } from './types';


type VisitorExtension = (next: VisitorInvocation) => Result


interface VisitorInvocation {
    value: {},
    type: Class,
    path: string,
    decorators: any[]
    proceed(): Result
}

class ExtensionInvocationImpl implements VisitorInvocation {
    value: {}
    type: Class
    path: string
    decorators: any[]

    constructor(public ext: VisitorExtension, private next: VisitorInvocation) {
        this.value = next.value
        this.type = next.type
        this.path = next.path
        this.decorators = next.decorators
    }

    proceed() {
        return this.ext(this.next)
    }
}

class VisitorInvocationImpl implements VisitorInvocation {
    value: {}
    type: Class
    path: string
    decorators: any[]
    constructor(value: {}, path: string, private ast: SuperNode, decorators:any[], private visitor: () => Result) {
        this.value = value
        this.type = ast.type
        this.path = path
        this.decorators = decorators
    }

    proceed(): Result {
        return this.visitor()
    }
}

function pipe(value: {}, strPath: string, ast: SuperNode, decorators: any[], extensions: VisitorExtension[], visitor: () => Result) {
    return extensions.reduce((prev, cur) => new ExtensionInvocationImpl(cur, prev),
        <VisitorInvocation>new VisitorInvocationImpl(value, strPath, ast, decorators, visitor))
}

export { pipe, VisitorExtension, VisitorInvocation }