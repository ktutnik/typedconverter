import createConverter from "../src"

const convert = createConverter({ type: Number })

describe("Number Converter", () => {

    it("Should convert number", async () => {
        const result = await convert("123")
        expect(result).toBe(123)
    })
    it("Should convert float", async () => {
        const result = await convert("123.123")
        expect(result).toBe(123.123)
    })
    it("Should convert negative", async () => {
        const result = await convert("-123")
        expect(result).toBe(-123)
    })
    it("Should convert negative float", async () => {
        const result = await convert("-123.123")
        expect(result).toBe(-123.123)
    })
    it("Should return undefined if provided null", async () => {
        const result = await convert(null)
        expect(result).toBeNull()
    })
    it("Should return undefined if provided undefined", async () => {
        const result = await convert(undefined)
        expect(result).toBeUndefined()
    })
    it("Should not convert string", async () => {
        try{
            await convert("Hello")
        }catch(e){
            expect(e.issues).toEqual([{ path: [], messages: [`Unable to convert "Hello" into Number`] }])
        }
    })
})
