import createConverter, { Invocation, ConversionResult, ConversionIssue, mergeResult, mergeIssue } from "../src"
import reflect, { decorateProperty } from 'tinspector';

describe("Visitor", () => {
    async function myVisitor(value: any, info: Invocation): Promise<ConversionResult> {
        const curErr = info.type === Number && value < 18 ? new ConversionIssue(info.path, "Must be older than 18") : undefined
        const [prevResult, prevErr] = await info.proceed()
        return [prevResult, mergeIssue(prevErr, curErr)]
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
    async function myVisitor(value: any, info: Invocation): Promise<ConversionResult> {
        const issue: ConversionIssue = { path: info.path, messages: ["Must be older than 18"] }
        const result = info.type === Number && value < 18 ? [issue] : undefined
        return mergeResult(await info.proceed(), [undefined, result])
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
    async function myVisitor(value: any, info: Invocation): Promise<ConversionResult> {
        const [result, err] = await info.proceed()
        const curError = info.decorators.some(x => x.type === "deco") ? new ConversionIssue(info.path, "Has decorator") : undefined
        return [result, mergeIssue(err, curError)]
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