import createConverter, { ConversionResult } from "../src"
const convert = createConverter({
    type: Boolean,
    converters: [{ 
        type: Boolean, 
        converter: async x => new ConversionResult("Custom Boolean") 
    }]
})

describe("Custom Converter", () => {
    it("Should able to use custom converter", async () => {
        const result = await convert("TRUE")
        expect(result).toBe("Custom Boolean")
    })
})