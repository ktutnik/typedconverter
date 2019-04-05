import createConverter, { ConversionResult, ConverterOption } from "../src"
import reflect from 'tinspector';

declare module "../src" {
    interface ConverterInvocation {
        step: number
    }
}

describe("Invocation Injection", () => {
    const convert = createConverter({
        visitors: [async (value, i) => {
            if (i.type === Number) return new ConversionResult(i.step)
            else return i.proceed()
        }]
    })

    it("Should able to inject on primitive data", async () => {
        const result = await convert(123, <ConverterOption>{ type: Number, step: 2000 })
        expect(result).toBe(2000)
    })

    it("Should able to inject on object", async () => {
        @reflect.parameterProperties()
        class Tag {
            constructor(public tag: number) { }
        }
        const result = await convert({ tag: 123 }, <ConverterOption>{ type: Tag, step: 2000 })
        expect(result).toEqual({ tag: 2000 })
    })

    it("Should able to inject data on array", async () => {
        @reflect.parameterProperties()
        class Tag {
            constructor(public tag: number) { }
        }
        const result = await convert([{ tag: 123 }, {tag: 234}, {tag: 456}], <ConverterOption>{ type: [Tag], step: 2000 })
        expect(result).toEqual([{ tag: 2000 }, {tag: 2000}, {tag: 2000}])
    })
})