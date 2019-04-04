import reflect, { decorateProperty } from "tinspector"

import createConverter, { ConversionMessage, ConversionResult, ConverterInvocation } from "../src"

describe("Visitor", () => {
    async function myVisitor(value: any, info: ConverterInvocation): Promise<ConversionResult> {
        const prevResult = await info.proceed()
        if (info.type === Number && prevResult.value < 18)
            return prevResult.merge(new ConversionMessage(info.path, "Must be older than 18"))
        else return prevResult
    }

    const convert = createConverter({
        visitors: [myVisitor]
    })

    it("Should convert value properly", async () => {
        const result = await convert("40", Number)
        expect(result).toBe(40)
    })

    it("Should throw error properly", async () => {
        await expect(convert("12", Number)).rejects.toThrow("Must be older than 18")
    })

    it("Should traverse through all object properties", async () => {
        @reflect.parameterProperties()
        class AnimalClass {
            constructor(
                public id: number,
                public name: string,
                public age: number
            ) { }
        }
        await expect(convert({ id: "12", name: "Mimi", age: "12" }, AnimalClass))
            .rejects.toThrow("id Must be older than 18\nage Must be older than 18")
    })

    it("Should traverse through nested object properties", async () => {
        @reflect.parameterProperties()
        class Tag {
            constructor(public age: number) { }
        }
        @reflect.parameterProperties()
        class AnimalClass {
            constructor(
                public id: number,
                public name: string,
                public tag: Tag
            ) { }
        }
        await expect(convert({ id: "12", name: "Mimi", tag: { age: "12" } }, AnimalClass))
            .rejects.toThrow("id Must be older than 18\ntag.age Must be older than 18")
    })

    it("Should traverse through array", async () => {
        @reflect.parameterProperties()
        class Tag {
            constructor(public age: number) { }
        }

        await expect(convert([{ age: "12" }, { age: "40" }, { age: "12" }], [Tag]))
            .rejects.toThrow("0.age Must be older than 18\n2.age Must be older than 18")
    })
})


describe("Multiple Visitors", () => {
    async function myVisitor(value: any, info: ConverterInvocation): Promise<ConversionResult> {
        const prevResult = await info.proceed()
        if (info.type === Number && prevResult.value < 18)
            return prevResult.merge(new ConversionMessage(info.path, "Must be older than 18"))
        else return prevResult
    }

    const convert = createConverter({
        visitors: [myVisitor, myVisitor]
    })

    it("Should throw error properly", async () => {
        @reflect.parameterProperties()
        class AnimalClass {
            constructor(
                public id: number,
                public name: string,
                public age: number
            ) { }
        }
        await expect(convert({ id: "12", name: "Mimi", age: "12" }, AnimalClass))
            .rejects.toThrow("id Must be older than 18, Must be older than 18\nage Must be older than 18, Must be older than 18")
    })
})

describe("Decorator distribution", () => {
    async function myVisitor(value: any, info: ConverterInvocation): Promise<ConversionResult> {
        const nextResult = await info.proceed()
        if (info.decorators.some(x => x.type === "deco"))
            return nextResult.merge(new ConversionMessage(info.path, "Has decorator"))
        return nextResult
    }
    const convert = createConverter({
        visitors: [myVisitor]
    })

    it("Should received by primitive converter", async () => {
        await expect(convert("123", { type: Number, decorators: [{ type: "deco" }] }))
            .rejects.toThrow("Has decorator")
    })

    it("Should received by class properties", async () => {
        @reflect.parameterProperties()
        class AnimalClass {
            constructor(
                public id: number,
                @decorateProperty({ type: "deco" })
                public name: string,
                @decorateProperty({ type: "deco" })
                public age: number
            ) { }
        }
        await expect(convert({ id: "12", name: "Mimi", age: "12" }, AnimalClass))
            .rejects.toThrow("name Has decorator\nage Has decorator")
    })

    it("Should received by class with nested properties", async () => {
        @reflect.parameterProperties()
        class Tag {
            constructor(
                @decorateProperty({ type: "deco" })
                public age: number
            ) { }
        }
        @reflect.parameterProperties()
        class AnimalClass {
            constructor(
                public id: number,
                public name: string,
                public tag: Tag
            ) { }
        }
        await expect(convert({ id: "12", name: "Mimi", tag: { age: "12" } }, AnimalClass))
            .rejects.toThrow("tag.age Has decorator")
    })

    it("Should received by array item", async () => {
        @reflect.parameterProperties()
        class Tag {
            constructor(
                @decorateProperty({ type: "deco" })
                public age: number) { }
        }

        await expect(convert([{ age: "12" }, { age: "40" }, { age: "12" }], [Tag]))
            .rejects.toThrow("0.age Has decorator\n1.age Has decorator\n2.age Has decorator")
    })
})

describe("Result Merge", () => {
    async function myVisitor(value: any, info: ConverterInvocation): Promise<ConversionResult> {
        const prevResult = await info.proceed()
        if (info.type === Number)
            return prevResult.merge(new ConversionMessage(info.path, "Lorem ipsum"))
        else
            return prevResult
    }

    const convert = createConverter({
        visitors: [myVisitor]
    })


    it("Should merge error on primitive type", async () => {
        await expect(convert("abc", Number)).rejects.toThrow("Unable to convert \"abc\" into Number, Lorem ipsum")
    })

    it("Should merge error on nested object property", async () => {
        @reflect.parameterProperties()
        class Tag {
            constructor(public tag: number) { }
        }
        @reflect.parameterProperties()
        class AnimalClass {
            constructor(
                public id: number,
                public tag: Tag,
            ) { }
        }
        await expect(convert({ id: "10", tag: { tag: "abc" } }, AnimalClass))
            .rejects.toThrow("id Lorem ipsum\ntag.tag Unable to convert \"abc\" into Number, Lorem ipsum")
    })

    it("Should merge error on array", async () => {
        @reflect.parameterProperties()
        class Tag {
            constructor(public tag: number) { }
        }
        await expect(convert([{tag: "1"}, {tag: "123"}], [Tag]))
            .rejects.toThrow("0.tag Lorem ipsum\n1.tag Lorem ipsum")
    })

    it("Should be able to merge with previous result", async () => {
        async function myVisitor(value: any, info: ConverterInvocation): Promise<ConversionResult> {
            const prevResult = await info.proceed()
            if (info.type === Number)
                return prevResult.merge(new ConversionResult(200))
            else
                return prevResult
        }
        const convert = createConverter({
            visitors: [myVisitor]
        })
        const result = await convert("400", Number)
        expect(result).toBe(200)
    })
})