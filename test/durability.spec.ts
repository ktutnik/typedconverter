import createConverter, { ConversionError } from "../src"
import reflect from 'tinspector';

const convert = createConverter()

describe("Durability test", () => {
    it("Should return non converted value if no expected type provided", () => {
        const result = convert({ a: "123", b: 100 })
        expect(result).toEqual({ a: "123", b: 100 })
    })

    it("Should not error if provided non safe to string", () => {
        try {
            const result = convert(Object.create(null), Number)
        }
        catch (e) {
            expect(e.issues).toEqual([{
                path: [],
                messages: ['Unable to convert "[object Object]" into Number'],
            }])
        }
    })

    it("Should provide friendly message if unable to instantiate object", () => {
        @reflect.parameterProperties()
        class AnimalClass {
            constructor(
                public id: number,
                public name: string,
                public deceased: boolean,
                public birthday: Date
            ) {
                throw new Error("ERROR")
            }
        }

        try {
            convert({ id: "200", name: "Mimi", deceased: "ON", birthday: "2018-1-1" }, AnimalClass)
        }
        catch (e) {
            expect(e.message).toContain("Unable to instantiate AnimalClass")
        }
    })

    it("Should provide friendly message if unable to instantiate object", () => {
        @reflect.parameterProperties()
        class AnimalClass {
            constructor(
                public id: number,
                public name: string,
                public deceased: boolean,
                public birthday: Date
            ) {
                throw "ERROR"
            }
        }

        try {
            convert({ id: "200", name: "Mimi", deceased: "ON", birthday: "2018-1-1" }, AnimalClass)
        }
        catch (e) {
            expect(e.message).toContain("Unable to instantiate AnimalClass")
        }
    })

    it("Should provide informative error message", () => {
        @reflect.parameterProperties()
        class AnimalClass {
            constructor(
                public id: number,
                public name: string,
                public deceased: boolean,
                public birthday: Date
            ) { }
        }

        try {
            convert({ id: "200", name: "Mimi", deceased: "ABC", birthday: "DEF" }, AnimalClass)
        }
        catch (e) {
            expect(e.issues).toEqual(
                [{ "messages": ["Unable to convert \"ABC\" into Boolean"], "path": ["deceased"] },
                { "messages": ["Unable to convert \"DEF\" into Date"], "path": ["birthday"] }])
        }
    })

    it("Should provide informative error message on array", () => {
        @reflect.parameterProperties()
        class AnimalClass {
            constructor(
                public id: number,
                public name: string,
                public deceased: boolean,
                public birthday: Date
            ) { }
        }

        try {
            convert([
                { id: "200", name: "Mimi", deceased: "ON", birthday: "2018-1-1" },
                { id: "200", name: "Mimi", deceased: "ABC", birthday: "DEF" },
            ], [AnimalClass])
        }
        catch (e) {
            expect(e.issues).toEqual(
                [{ "messages": ["Unable to convert \"ABC\" into Boolean"], "path": ["1", "deceased"] },
                { "messages": ["Unable to convert \"DEF\" into Date"], "path": ["1", "birthday"] }])
        }
    })
})