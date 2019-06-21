import reflect from 'tinspector';
import joi from "joi"
import create from "../src"

@reflect.parameterProperties()
class Address {
    constructor(public zip: string, public city: string, number: number) { }
}

@reflect.parameterProperties()
class MyData {
    constructor(
        public name: string,
        public date: Date,
        public address: Address
    ) { }
}
const schema = joi.object({
    name: joi.string(),
    date: joi.date(),
    address: joi.object({
        zip: joi.string(),
        city: joi.string(),
        number: joi.number()
    })
});

const convert = create({ type: MyData });

const value = { name: "Lorem ipsum", date: "2018-1-1", address: { zip: "123", city: "CA", number: "123" } };

(async () => {
    console.log(convert(value))
    console.log(schema.validate(value))

    const iteration = 4000000;

    console.time("NewLogic")
    for (let i = 0; i < iteration; i++) {
        const result = convert(value)
    }
    console.timeEnd("NewLogic")

    console.time("Joi")
    for (let i = 0; i < iteration; i++) {
        const result = await schema.validate(value)
    }
    console.timeEnd("Joi")
})()
