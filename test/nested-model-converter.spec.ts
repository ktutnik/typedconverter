import createConverter, { ConversionError } from "../src"
import reflect from "tinspector"

const convert = createConverter()

describe("Nested Model", () => {
    reflect.parameterProperties()
    class ClientClass {
        constructor(
            public id: number,
            public name: string,
            public join: Date
        ) { }
    }

    reflect.parameterProperties()
    class AnimalClass {
        constructor(
            public id: number,
            public name: string,
            public deceased: boolean,
            public birthday: Date,
            public owner: ClientClass
        ) { }
    }

    it("Should convert nested model", () => {
        const result: AnimalClass = convert({
            id: "200",
            name: "Mimi",
            deceased: "ON",
            birthday: "2018-1-1",
            owner: { id: "400", name: "John Doe", join: "2015-1-1" }
        }, AnimalClass)
        expect(result).toBeInstanceOf(AnimalClass)
        expect(result.owner).toBeInstanceOf(ClientClass)
        expect(result).toEqual({
            birthday: new Date("2018-1-1"),
            deceased: true,
            id: 200,
            name: "Mimi",
            owner: { id: 400, name: "John Doe", join: new Date("2015-1-1") }
        })
    })

    it("Should sanitize excess data", () => {
        const result: AnimalClass = convert({
            id: "200",
            name: "Mimi",
            deceased: "ON",
            birthday: "2018-1-1",
            excess: "Malicious Code",
            owner: { id: "400", name: "John Doe", join: "2015-1-1", excess: "Malicious Code" }
        }, AnimalClass)
        expect(result).toBeInstanceOf(AnimalClass)
        expect(result.owner).toBeInstanceOf(ClientClass)
        expect(result).toEqual({
            birthday: new Date("2018-1-1"),
            deceased: true,
            id: 200,
            name: "Mimi",
            owner: { id: 400, name: "John Doe", join: new Date("2015-1-1") }
        })
    })

    it("Should allow undefined values", () => {
        const result: AnimalClass = convert({
            id: "200",
            name: "Mimi",
            owner: { id: "400", name: "John Doe" }
        }, AnimalClass)
        expect(result).toBeInstanceOf(AnimalClass)
        expect(result.owner).toBeInstanceOf(ClientClass)
        expect(result).toEqual({
            id: 200,
            name: "Mimi",
            owner: { id: 400, name: "John Doe" }
        })
    })

    it("Should throw if non convertible value provided", () => {
        expect(() => convert({
            id: "200",
            name: "Mimi",
            deceased: "ON",
            birthday: "2018-1-1",
            owner: { id: "400", name: "John Doe", join: "Hello" }
        }, AnimalClass)).toThrow(new ConversionError({ path: ["id", "owner", "join"], messages: [`Unable to convert "Hello" into Date`] }))
    })

    it("Should throw if non convertible model provided", () => {
        expect(() => convert({
            id: "200",
            name: "Mimi",
            deceased: "ON",
            birthday: "2018-1-1",
            owner: "Hello"
        }, AnimalClass)).toThrow(new ConversionError({ path: ["id", "owner"], messages: [`Unable to convert "Hello" into ClientClass`] }))
    })
})