import createConverter from "../src"
const convert = createConverter({ type: Boolean, converters: [[Boolean, async x => (["Custom Boolean", undefined])]] })

describe("Custom Converter", () => {
    it("Should able to use custom converter", async () => {
        const result = await convert("TRUE")
        expect(result).toBe("Custom Boolean")
    })
})