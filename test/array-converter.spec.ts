
import createConverter, { ConversionError } from "../src"
import reflect from "tinspector"

const convert = createConverter()

describe("Array Converter", () => {
    it("Should convert array of number", () => {
        const result = convert(["123", "123", "123"], [Number])
        expect(result).toEqual([123, 123, 123])
    })

    it("Should convert array of model", () => {
        @reflect.parameterProperties()
        class AnimalClass {
            constructor(
                public id: number,
                public name: string,
                public deceased: boolean,
                public birthday: Date
            ) { }
        }
        const result = convert([
            { id: "200", name: "Mimi", deceased: "ON", birthday: "2018-1-1" },
            { id: "200", name: "Mimi", deceased: "ON", birthday: "2018-1-1" },
            { id: "200", name: "Mimi", deceased: "ON", birthday: "2018-1-1" }
        ], [AnimalClass])
        expect(result).toEqual([
            { birthday: new Date("2018-1-1"), deceased: true, id: 200, name: "Mimi" },
            { birthday: new Date("2018-1-1"), deceased: true, id: 200, name: "Mimi" },
            { birthday: new Date("2018-1-1"), deceased: true, id: 200, name: "Mimi" }
        ])
    })

    it("Should convert nested array inside model", () => {
        @reflect.parameterProperties()
        class TagModel {
            constructor(
                public id: number,
                public name: string,
            ) { }
        }
        @reflect.parameterProperties()
        class AnimalClass {
            constructor(
                public id: number,
                public name: string,
                public deceased: boolean,
                public birthday: Date,
                @reflect.array(TagModel)
                public tags: TagModel[]
            ) { }
        }
        const result = convert([
            { id: "200", name: "Mimi", deceased: "ON", birthday: "2018-1-1", tags: [{ id: "300", name: "Tug" }] },
            { id: "200", name: "Mimi", deceased: "ON", birthday: "2018-1-1", tags: [{ id: "300", name: "Tug" }] },
            { id: "200", name: "Mimi", deceased: "ON", birthday: "2018-1-1", tags: [{ id: "300", name: "Tug" }] }
        ], [AnimalClass])
        expect(result).toEqual([
            { birthday: new Date("2018-1-1"), deceased: true, id: 200, name: "Mimi", tags: [{ id: 300, name: "Tug" }] },
            { birthday: new Date("2018-1-1"), deceased: true, id: 200, name: "Mimi", tags: [{ id: 300, name: "Tug" }] },
            { birthday: new Date("2018-1-1"), deceased: true, id: 200, name: "Mimi", tags: [{ id: 300, name: "Tug" }] }
        ])
    })

    it("Should throw error if provided expectedType of type of array", () => {
        @reflect.parameterProperties()
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