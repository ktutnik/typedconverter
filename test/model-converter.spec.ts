import createConverter, { ConversionError } from "../src"
import reflect from "tinspector"

const convert = createConverter()

describe("Model Converter", () => {
    it.only("Should convert model and appropriate properties", () => {
        reflect.parameterProperties()
        class AnimalClass {
            constructor(
                public id: number,
                public name: string,
                public deceased: boolean,
                public birthday: Date
            ) { }
        }

        const result = convert({ id: "200", name: "Mimi", deceased: "ON", birthday: "2018-1-1" }, AnimalClass)
        expect(result).toBeInstanceOf(AnimalClass)
        expect(result).toEqual({ birthday: new Date("2018-1-1"), deceased: true, id: 200, name: "Mimi" })
    })

    it("Should not convert excess properties", () => {
        reflect.parameterProperties()
        class AnimalClass {
            constructor(
                public id: number,
                public name: string,
            ) { }
        }

        const result = convert({ id: "200", name: "Mimi", deceased: "ON", birthday: "2018-1-1", }, AnimalClass)
        expect(result).toBeInstanceOf(AnimalClass)
        expect(result).toEqual({ id: 200, name: "Mimi" })
    })

    /*
    it("Should not sanitized if no constructor property found", () => {
        class AnimalClass {
            constructor(
                public id: number,
                public name: string,
                public deceased: boolean,
                public birthday: Date
            ) { }
        }

        const result = convert({ id: "200", name: "Mimi", deceased: "ON", birthday: "2018-1-1" }, AnimalClass)
        expect(result).toBeInstanceOf(AnimalClass)
        expect(result).toEqual({ id: "200", name: "Mimi", deceased: "ON", birthday: "2018-1-1" })
    })
    */

    it("Should allow undefined value", () => {
        reflect.parameterProperties()
        class AnimalClass {
            constructor(
                public id: number,
                public name: string,
                public deceased: boolean,
                public birthday: Date
            ) { }
        }

        const result = convert({}, AnimalClass)
        expect(result).toBeInstanceOf(AnimalClass)
        expect(result).toEqual({})
    })

    it("Should throw if provided non convertible value", () => {
        reflect.parameterProperties()
        class AnimalClass {
            constructor(
                public id: number,
                public name: string,
                public deceased: boolean,
                public birthday: Date
            ) { }
        }

        expect(() => {
            convert({ id: "200", name: "Mimi", deceased: "Hello", birthday: "2018-1-1" }, AnimalClass)
        }).toThrow(new ConversionError({ path: ["id", "deceased"], messages: [`Unable to convert "Hello" into Boolean`] }))
    })

    it("Should throw if provided non convertible value", () => {
        reflect.parameterProperties()
        class AnimalClass {
            constructor(
                public id: number,
                public name: string,
                public deceased: boolean,
                public birthday: Date
            ) { }
        }

        expect(() => {
            convert("Hello", AnimalClass)
        }).toThrow(new ConversionError({ path: ["id"], messages: [`Unable to convert "Hello" into AnimalClass`] }))
    })

    it("Should not populate optional properties with undefined", () => {
        reflect.parameterProperties()
        class AnimalClass {
            constructor(
                public id: number,
                public name: string,
                public deceased: boolean | undefined,
                public birthday: Date | undefined
            ) { }
        }

        const result = convert({ id: "200", name: "Mimi", excess: "Hola" }, AnimalClass)
        expect(result).toBeInstanceOf(AnimalClass)
        expect(Object.keys(result)).toEqual(["id", "name"])
        expect(result).toEqual({ id: 200, name: "Mimi" })
    })

    it("Should throw error if provided expectedType of type of array", () => {
        reflect.parameterProperties()
        class AnimalClass {
            constructor(
                public id: number,
                public name: string,
                public deceased: boolean,
                public birthday: Date
            ) { }
        }
        expect(() => convert({ id: "200", name: "Mimi", deceased: "ON", birthday: "2018-1-1" }, [AnimalClass]))
            .toThrow(ConversionError)
    })
})