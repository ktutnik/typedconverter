import createConverter, { ConversionError } from "../src"
const convert = createConverter({ type: Number })

describe("Number Converter", () => {

    it("Should convert number", () => {
        const result = convert("123")
        expect(result).toBe(123)
    })
    it("Should convert float", () => {
        const result = convert("123.123")
        expect(result).toBe(123.123)
    })
    it("Should convert negative", () => {
        const result = convert("-123")
        expect(result).toBe(-123)
    })
    it("Should convert negative float", () => {
        const result = convert("-123.123")
        expect(result).toBe(-123.123)
    })
    it("Should return undefined if provided null", () => {
        const result = convert(null)
        expect(result).toBeUndefined()
    })
    it("Should return undefined if provided undefined", () => {
        const result = convert(undefined)
        expect(result).toBeUndefined()
    })
    it("Should not convert string", () => {
        expect(() => convert("hello"))
            .toThrow(new ConversionError({ path: ["id"], messages: [`Unable to convert "hello" into Number`] }))
    })
})
