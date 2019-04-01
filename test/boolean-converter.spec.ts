import createConverter, { ConversionError } from "../src"
const convert = createConverter({ type: Boolean })

describe("Boolean Converter", () => {
    it("Should convert Trusty string to true", () => {
        const result = ["ON", "TRUE", "1", "YES", 1].map(x => convert(x))
        expect(result.every(x => x == true)).toEqual(true)
    })
    it("Should convert Falsy into false", () => {
        const result = ["OFF", "FALSE", "0", "NO", 0].map(x => convert(x))
        expect(result.every(x => x == false)).toEqual(true)
    })
    it("Should return undefined if provided null", () => {
        const result = convert(null)
        expect(result).toBeUndefined()
    })
    it("Should return undefined if provided undefined", () => {
        const result = convert(undefined)
        expect(result).toBeUndefined()
    })
    it("Should throw error when provided non convertible string", () => {
        expect(() => convert("Hello")).toThrow(new ConversionError([{ path: ["id"], messages: [`Unable to convert "Hello" into Boolean`] }]))
    })
    it("Should throw error when provided non convertible number", () => {
        expect(() => convert(200)).toThrow(new ConversionError([{ path: ["id"], messages: [`Unable to convert "200" into Boolean`] }]))
    })
})