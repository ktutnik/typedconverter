# TypedConverter
Convert object into classes match with TypeScript type annotation

[![Build Status](https://travis-ci.org/plumier/typedconverter.svg?branch=master)](https://travis-ci.org/plumier/typedconverter)
[![Coverage Status](https://coveralls.io/repos/github/plumier/typedconverter/badge.svg?branch=master)](https://coveralls.io/github/plumier/typedconverter?branch=master) [![Greenkeeper badge](https://badges.greenkeeper.io/plumier/typedconverter.svg)](https://greenkeeper.io/)


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

@reflect.parameterProperties()
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

## Convert Array 
Convert into array by providing array of type in the expected type.

```typescript
import createConverter from "typedconverter";

const convert = createConverter()
const numb = convert(["1", "2", "-3"], [Number])
```

## Convert Child Array
Nested child array need to be decorate for TypeScript added design data type

```typescript
import createConverter from "typedconverter";

@reflect.parameterProperties()
class Tag {
    constructor(
        public name: string,
    ) { }
}

@reflect.parameterProperties()
class Animal {
    constructor(
        public name: string,
        @reflect.array(Tag)
        public tags: Tags
    ) { }
}

const convert = createConverter()
//tags is instance of Tag class
const numb = convert({name: "Mimi", tags: [{name: "Susi"}, {name: "Lorem"}]}, Animal)
```

## Custom Converter
Provided custom converter on the configuration 

```typescript
import createConverter from "typedconverter";

const convert = createConverter({ 
    type: Boolean, 
    converters: [{ key: Boolean, converter: x => "Custom Boolean" }] 
})
const numb = convert("True") //result: "Custom Boolean"
```

## Guess Array Element
Useful when converting data from url encoded, where single value could be a single array. 

```typescript
const convert = createConverter({ guessArrayElement: true })
const b = convert("1", [Number]) //ok
```

