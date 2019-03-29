# TypedConverter
Convert object into classes match with TypeScript type annotation

[![Build Status](https://travis-ci.org/plumier/typedconverter.svg?branch=master)](https://travis-ci.org/plumier/typedconverter)
[![Coverage Status](https://coveralls.io/repos/github/plumier/typedconverter/badge.svg?branch=master)](https://coveralls.io/github/plumier/typedconverter?branch=master)


## Convert Primitive Type 

```typescript
import createConverter from "typedconverter";

const convert = createConverter()
const numb = convert("12345", Number) //return number 12345
const numb = convert("YES", Boolean) //return true
const numb = convert("2019-1-1", Date) //return date 1/1/2019
```

## Specify type on configuration 
Expected type can be specified in the configuration, than you can omit expected type on the second parameter of the `convert` function. Useful when you want to covert several times without specifying expected type. 

```typescript
import createConverter from "typedconverter";

const convert = createConverter({type: Number})
const numb = convert("12345")
const numb1 = convert("-12345")
const numb2 = convert("12345.123")
```

## Convert custom class 
TypedConvert uses tinspector to get type metadata, so it aware about TypeScript type annotation. 

```typescript
import createConverter from "typedconverter";
import reflect from "tinspector"

const convert = createConverter()

reflect.parameterProperties()
class AnimalClass {
    constructor(
        public id: number,
        public name: string,
        public deceased: boolean,
        public birthday: Date
    ) { }
}
//return instance of AnimalClass with appropriate properties type
const data = convert({ 
    id: "200", 
    name: "Mimi", 
    deceased: "ON", 
    birthday: "2018-1-1" }, 
    AnimalClass) 
```

