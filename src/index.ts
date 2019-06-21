import { VisitorExtension } from "./invocation"
import { transform } from "./transformer"
import { Class } from "./types"
import { pipeline } from "./visitor"

interface Option {
    type: Class | Class[],
    visitors?: VisitorExtension[]
    decorators?: any[]
}

function convert(value: any, opt: Option) {
    return pipeline(value, transform(opt.type), "", opt.visitors || [], opt.decorators || [])
}

export default function createConverter(option: Option) {
    return (value: any) => convert(value, option)
}

export { convert, Option }