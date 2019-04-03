import createConverter, { ConversionError } from "../src"
const convert = createConverter({ type: Date })

describe("Date Converter", () => {
    it("Should convert date", async () => {
        const result = await convert("2018-12-22")
        expect(result.getTime()).toEqual(new Date("2018-12-22").getTime())
    })
    it("Should convert date", async () => {
        const result = await convert("12/22/2018")
        expect(result.getTime()).toEqual(new Date("12/22/2018").getTime())
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
        try{
            await convert("Hello")
        }catch(e){
            expect(e.issues).toEqual([{ path: [], messages: [`Unable to convert "Hello" into Date`] }])
        }
    })
})