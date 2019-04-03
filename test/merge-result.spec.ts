import {mergeResult} from "../src"

describe("mergeResult", () => {
    it("Should merge result properly", () => {
        const result = mergeResult([1, undefined], [200, undefined])
        expect(result).toEqual([200, undefined])
    })

    it("Should use")
})