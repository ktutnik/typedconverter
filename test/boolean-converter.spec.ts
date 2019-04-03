import createConverter, { ConversionError } from "../src"
const convert = createConverter({ type: Boolean })

describe("Boolean Converter", () => {
    it("Should convert Trusty string to true", async () => {
        const result = await Promise.all(["ON", "TRUE", "1", "YES", 1].map(x => convert(x)))
        expect(result.every(x => x == true)).toEqual(true)
    })
    it("Should convert Falsy into false", async () => {
        const result = await Promise.all(["OFF", "FALSE", "0", "NO", 0].map(x => convert(x)))
        expect(result.every(x => x == false)).toEqual(true)
    })
    it("Should return undefined if provided null", async () => {
        const result = await convert(null)
        expect(result).toBeUndefined()
    })
    it("Should return undefined if provided undefined", async () => {
        const result = await convert(undefined)
        expect(result).toBeUndefined()
    })
    it("Should throw error when provided non convertible string", async () => {
        try {
            await convert("Hello")
        }
        catch (e) {
            expect(e.issues).toEqual([{ path: [], messages: [`Unable to convert "Hello" into Boolean`] }])
        }
    })
    it("Should throw error when provided non convertible number", async () => {
        try {
            await convert(200)
        }
        catch (e) {
            expect(e.issues).toEqual([{ path: [], messages: [`Unable to convert "200" into Boolean`] }])
        }
    })
})