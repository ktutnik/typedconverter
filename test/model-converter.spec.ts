import createConverter, { ConversionError } from "../src"
import reflect from "tinspector"

const convert = createConverter()

describe("Model Converter", () => {
    it("Should convert model and appropriate properties", async () => {
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
            const result = await convert({ id: "200", name: "Mimi", deceased: "ON", birthday: "2018-1-1" }, AnimalClass)
            expect(result).toBeInstanceOf(AnimalClass)
            expect(result).toEqual({ birthday: new Date("2018-1-1"), deceased: true, id: 200, name: "Mimi" })
        } catch (e) {
            console.log(e)
        }
    })

    it("Should not convert excess properties", async () => {
        @reflect.parameterProperties()
        class AnimalClass {
            constructor(
                public id: number,
                public name: string,
            ) { }
        }

        const result = await convert({ id: "200", name: "Mimi", deceased: "ON", birthday: "2018-1-1", }, AnimalClass)
        expect(result).toBeInstanceOf(AnimalClass)
        expect(result).toEqual({ id: 200, name: "Mimi" })
    })


    it("Should allow undefined value", async () => {
        @reflect.parameterProperties()
        class AnimalClass {
            constructor(
                public id: number,
                public name: string,
                public deceased: boolean,
                public birthday: Date
            ) { }
        }

        const result = await convert({}, AnimalClass)
        expect(result).toBeInstanceOf(AnimalClass)
        expect(result).toEqual({})
    })

    it("Should throw if provided non convertible value", async () => {
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
            await convert({ id: "200", name: "Mimi", deceased: "Hello", birthday: "2018-1-1" }, AnimalClass)
        } catch (e) {
            expect(e.issues).toEqual([{ path: ["deceased"], messages: [`Unable to convert "Hello" into Boolean`] }])
        }
    })

    it("Should throw if provided non convertible value", async () => {
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
            await convert("Hello", AnimalClass)
        } catch (e) {
            expect(e.issues).toEqual([{ path: [], messages: [`Unable to convert "Hello" into AnimalClass`] }])
        }
    })

    it("Should not populate optional properties with undefined", async () => {
        @reflect.parameterProperties()
        class AnimalClass {
            constructor(
                public id: number,
                public name: string,
                public deceased: boolean | undefined,
                public birthday: Date | undefined
            ) { }
        }

        const result = await convert({ id: "200", name: "Mimi", excess: "Hola" }, AnimalClass)
        expect(result).toBeInstanceOf(AnimalClass)
        expect(Object.keys(result)).toEqual(["id", "name"])
        expect(result).toEqual({ id: 200, name: "Mimi" })
    })

    it("Should not convert if expected type is Object", async () => {
        const result = await convert({
            host: '127.0.0.1:61945',
            'accept-encoding': 'gzip, deflate',
            'user-agent': 'node-superagent/3.8.3',
            'content-type': 'application/json',
            'content-length': '67',
            connection: 'close'
        }, Object)
        expect(result).toEqual({
            host: '127.0.0.1:61945',
            'accept-encoding': 'gzip, deflate',
            'user-agent': 'node-superagent/3.8.3',
            'content-type': 'application/json',
            'content-length': '67',
            connection: 'close'
        })
    })
})