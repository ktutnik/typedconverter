import createConverter from "../src"
import reflect from 'tinspector';
import joi from "joi"

const convert = createConverter()

@reflect.parameterProperties()
class MyData {
    constructor(
        public name:string,
        public date:Date
    ){}
}
const schema = joi.object({
    name: joi.string(),
    date: joi.date()
});

(async () => {
    const iteration = 400000;
    console.time("TypedConverter")
    for (let i = 0; i < iteration; i++) {
        const result = await convert({name: "ABCDEF", date: "2019-1-1"}, MyData)
    }
    console.timeEnd("TypedConverter")

    console.time("TypedConverter")
    for (let i = 0; i < iteration; i++) {
        const result = schema.validate({name: "ABCDEF", date: "2019-1-1"})
    }
    console.timeEnd("TypedConverter")
})()
