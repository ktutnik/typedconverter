import createConverter from "../src"
const convert = createConverter({
    type: Boolean, converters: [{ type: Boolean, converter: x => (["Custom Boolean", undefined]) }]
})

describe("Custom Converter", () => {
    it("Should able to use custom converter", () => {
        const result = convert("TRUE")
        expect(result).toBe("Custom Boolean")
    })
})