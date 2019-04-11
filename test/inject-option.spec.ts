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
        }],
        interceptor: visitor => (value, invocation) => {
            invocation.step = 2000;
            return visitor(value, invocation)
        }
    })

    it("Should able to inject on primitive data", async () => {
        const result = await convert(123, Number)
        expect(result).toBe(2000)
    })

    it("Should able to inject on object", async () => {
        @reflect.parameterProperties()
        class Tag {
            constructor(public tag: number) { }
        }
        const result = await convert({ tag: 123 }, Tag)
        expect(result).toEqual({ tag: 2000 })
    })

    it("Should able to inject data on array", async () => {
        @reflect.parameterProperties()
        class Tag {
            constructor(public tag: number) { }
        }
        const result = await convert([{ tag: 123 }, { tag: 234 }, { tag: 456 }], [Tag])
        expect(result).toEqual([{ tag: 2000 }, { tag: 2000 }, { tag: 2000 }])
    })
})