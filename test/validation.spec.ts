import reflect, { decorateMethod } from "tinspector"

import {
    convert,
    OptionalValidator,
    PartialValidator,
    requiredValidationVisitor,
    val,
    validate,
    ValidatorDecorator,
    validatorVisitor,
    VisitorInvocation,
    Result,
} from "../src"


describe("Optional & Partial Validation", () => {
    describe("Decorators", () => {
        it("Should able to decorate optional validator", () => {
            @reflect.parameterProperties()
            class AnimalClass {
                constructor(
                    public id: number,
                    public name: string,
                    public deceased: boolean,
                    @val.optional()
                    public birthday: Date
                ) { }
            }
            expect(reflect(AnimalClass)).toMatchSnapshot()
        })

        it("Should able to decorate partial validator", () => {
            @reflect.parameterProperties()
            class AnimalClass {
                constructor(
                    public id: number,
                    public name: string,
                    public deceased: boolean,
                    public birthday: Date
                ) { }
            }

            class AnimalController {
                @decorateMethod({})
                save(@val.partial(AnimalClass) data: AnimalClass) { }
            }
            expect(reflect(AnimalController)).toMatchSnapshot()
        })
    })

    describe("Primitive Type Validation", () => {

        it("Should validate undefined", () => {
            const result = convert(undefined, {
                path: "data",
                type: Number,
                visitors: [requiredValidationVisitor]
            })
            expect(result).toMatchSnapshot()
        })
        it("Should validate null", () => {
            const result = convert(null, {
                path: "data",
                type: Number,
                visitors: [requiredValidationVisitor]
            })
            expect(result).toMatchSnapshot()
        })
        it("Should valid if optional", () => {
            const result = convert(null, {
                decorators: [<ValidatorDecorator>{ type: "tc:validator", validator: OptionalValidator }],
                path: "data",
                type: Number,
                visitors: [requiredValidationVisitor]
            })
            expect(result).toMatchSnapshot()
        })
    })

    describe("Object Validator", () => {
        @reflect.parameterProperties()
        class AnimalClass {
            constructor(
                public id: number,
                public name: string,
                public deceased: boolean,
                @val.optional()
                public birthday: Date
            ) { }
        }

        const option = { type: AnimalClass, visitors: [requiredValidationVisitor] }

        it("Should validate undefined property", () => {
            const result = convert({ id: undefined, name: "Mimi", deceased: "ON", birthday: "2018-1-1" }, { ...option })
            expect(result).toMatchSnapshot()
        })

        it("Should validate null property", () => {
            const result = convert({ id: null, name: "Mimi", deceased: "ON", birthday: "2018-1-1" }, { ...option })
            expect(result).toMatchSnapshot()
        })

        it("Should valid if provided null optional", () => {
            const result = convert({ id: "123", name: "Mimi", deceased: "ON", birthday: null }, { ...option })
            expect(result).toMatchSnapshot()
        })

        it("Should valid if provided undefined optional", () => {
            const result = convert({ id: "123", name: "Mimi", deceased: "ON", birthday: undefined }, { ...option })
            expect(result).toMatchSnapshot()
        })
    })

    describe("Array of Primitive Type Validation", () => {

        it("Should validate undefined", () => {
            const result = convert(["1", undefined, "3"], {
                path: "data",
                type: [Number],
                visitors: [requiredValidationVisitor]
            })
            expect(result).toMatchSnapshot()
        })
        it("Should validate null", () => {
            const result = convert(["1", null, "3"], {
                path: "data",
                type: [Number],
                visitors: [requiredValidationVisitor]
            })
            expect(result).toMatchSnapshot()
        })
        it("Should valid if optional", () => {
            const result = convert(["1", null, "3"], {
                decorators: [<ValidatorDecorator>{ type: "tc:validator", validator: OptionalValidator }],
                path: "data",
                type: [Number],
                visitors: [requiredValidationVisitor]
            })
            expect(result).toMatchSnapshot()
        })
    })

    describe("Array of Object Validator", () => {
        @reflect.parameterProperties()
        class AnimalClass {
            constructor(
                public id: number,
                public name: string,
                public deceased: boolean,
                @val.optional()
                public birthday: Date
            ) { }
        }

        const option = { type: [AnimalClass], visitors: [requiredValidationVisitor] }

        it("Should validate undefined property", () => {
            const result = convert([undefined, { id: undefined, name: "Mimi", deceased: "ON", birthday: "2018-1-1" }], { ...option })
            expect(result).toMatchSnapshot()
        })

        it("Should validate null property", () => {
            const result = convert([undefined, { id: null, name: "Mimi", deceased: "ON", birthday: "2018-1-1" }], { ...option })
            expect(result).toMatchSnapshot()
        })

        it("Should valid if optional", () => {
            const result = convert([undefined, { id: "123", name: "Mimi", deceased: "ON", birthday: null }], { ...option, decorators: [<ValidatorDecorator>{ type: "tc:validator", validator: OptionalValidator }] })
            expect(result).toMatchSnapshot()
        })
    })

    describe("Nested Object Validator", () => {
        @reflect.parameterProperties()
        class TagClass {
            constructor(
                public id: number,
                @val.optional()
                public name: string
            ) { }
        }

        @reflect.parameterProperties()
        class AnimalClass {
            constructor(
                public id: number,
                public name: string,
                public deceased: boolean,
                public birthday: Date,
                public tag: TagClass
            ) { }
        }

        const option = { type: AnimalClass, visitors: [requiredValidationVisitor] }

        it("Should validate undefined property", () => {
            const result = convert({ id: "123", name: "Mimi", deceased: "ON", birthday: "2018-1-1", tag: { id: undefined, name: "The Tag" } }, { ...option })
            expect(result).toMatchSnapshot()
        })

        it("Should validate null property", () => {
            const result = convert({ id: "123", name: "Mimi", deceased: "ON", birthday: "2018-1-1", tag: { id: null, name: "The Tag" } }, { ...option })
            expect(result).toMatchSnapshot()
        })

        it("Should valid if provided null optional", () => {
            const result = convert({ id: "123", name: "Mimi", deceased: "ON", birthday: "2018-1-1", tag: { id: "123", name: null } }, { ...option })
            expect(result).toMatchSnapshot()
        })

        it("Should valid if provided undefined optional", () => {
            const result = convert({ id: "123", name: "Mimi", deceased: "ON", birthday: "2018-1-1", tag: { id: "123", name: undefined } }, { ...option })
            expect(result).toMatchSnapshot()
        })
    })

    describe("Partial Validation", () => {
        it("Should pass empty field if parent marked with partial", () => {
            @reflect.parameterProperties()
            class AnimalClass {
                constructor(
                    public id: number,
                    public name: string,
                    public deceased: boolean,
                    public birthday: Date
                ) { }
            }
            const result = convert({ id: "123" }, {
                decorators: [<ValidatorDecorator>{ type: "tc:validator", validator: PartialValidator }],
                path: "data",
                type: AnimalClass,
                visitors: [requiredValidationVisitor]
            })
            expect(result).toMatchSnapshot()
        })

        it("Should skip optional validator on partial parent", () => {
            @reflect.parameterProperties()
            class AnimalClass {
                constructor(
                    public id: number,
                    public name: string,
                    @val.optional()
                    public deceased: boolean,
                    public birthday: Date
                ) { }
            }
            const result = convert({ id: "123" }, {
                decorators: [<ValidatorDecorator>{ type: "tc:validator", validator: PartialValidator }],
                path: "data",
                type: AnimalClass,
                visitors: [requiredValidationVisitor]
            })
            expect(result).toMatchSnapshot()
        })

        it("Should validate whole object even its partial and provided undefined", () => {
            @reflect.parameterProperties()
            class AnimalClass {
                constructor(
                    public id: number,
                    public name: string,
                    public deceased: boolean,
                    public birthday: Date
                ) { }
            }
            const result = convert(undefined, {
                decorators: [<ValidatorDecorator>{ type: "tc:validator", validator: PartialValidator }],
                path: "data",
                type: AnimalClass,
                visitors: [requiredValidationVisitor]
            })
            expect(result).toMatchSnapshot()
        })
    })

})

describe("Validator", () => {
    it("Should validate properly", () => {
        @reflect.parameterProperties()
        class Dummy {
            constructor(
                @val.email()
                public property: string
            ) { }
        }
        const result = validate({ property: "lorem.ipsum@gmail.com" }, { type: Dummy, })
        expect(result).toMatchObject({ value: { property: "lorem.ipsum@gmail.com" } })
    })

    it("Should able combine optional and email", () => {
        @reflect.parameterProperties()
        class Dummy {
            constructor(
                @val.optional()
                @val.email()
                public property: string
            ) { }
        }
        const result = validate({ property: undefined }, { type: Dummy, })
        expect(result).toMatchObject({ value: {} })
    })

    it("Should able combine optional and invalid email", () => {
        @reflect.parameterProperties()
        class Dummy {
            constructor(
                @val.optional()
                @val.email()
                public property: string
            ) { }
        }
        const result = validate({ property: "lorem ipsum" }, { type: Dummy, })
        expect(result).toMatchObject({ issues: [{ messages: ["Invalid email address"], path: "property" }] })
    })

    it("Should able combine optional and valid email", () => {
        @reflect.parameterProperties()
        class Dummy {
            constructor(
                @val.optional()
                @val.email()
                public property: string
            ) { }
        }
        const result = validate({ property: "lorem.ipsum@gmail.com" }, { type: Dummy, })
        expect(result).toMatchObject({ value: { property: "lorem.ipsum@gmail.com" } })
    })

    it("Should able to add custom visitor", () => {
        const visitor = (i:VisitorInvocation) => {
            if(i.type === String) return Result.create("lorem ipsum")
            else return i.proceed()
        }
        @reflect.parameterProperties()
        class Dummy {
            constructor(
                @val.optional()
                @val.email()
                public property: string
            ) { }
        }
        const result = validate({ property: "lorem.ipsum@gmail.com" }, { visitors: [visitor], type: Dummy, })
        expect(result).toMatchObject({ value: { property: "lorem ipsum" } })
    })
})
