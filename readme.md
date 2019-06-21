# TypedConverter
Convert object into classes match with TypeScript type annotation

[![Build Status](https://travis-ci.org/plumier/typedconverter.svg?branch=master)](https://travis-ci.org/plumier/typedconverter)
[![Coverage Status](https://coveralls.io/repos/github/plumier/typedconverter/badge.svg?branch=master)](https://coveralls.io/github/plumier/typedconverter?branch=master) [![Greenkeeper badge](https://badges.greenkeeper.io/plumier/typedconverter.svg)](https://greenkeeper.io/)


## Convert Primitive Type 

```typescript
import { convert } from "typedconverter";

const numb = await convert("12345", { type: Number }) //return number 12345
const numb = await convert("YES", { type: Boolean }) //return true
const numb = await convert("2019-1-1", { type: Date }) //return date 1/1/2019
```

## Specify type on configuration 
Expected type can be specified in the configuration, than you can omit expected type on the second parameter of the `convert` function. Useful when you want to covert several times without specifying expected type. 

```typescript
import createConverter from "typedconverter";

const convert = createConverter({type: Number})
const numb = await convert("12345")
const numb1 = await convert("-12345")
const numb2 = await convert("12345.123")
```

## Convert custom class 
TypedConvert uses tinspector to get type metadata, so it aware about TypeScript type annotation. 

```typescript
import {convert} from "typedconverter";
import reflect from "tinspector"


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
const data = await convert({ 
    id: "200", 
    name: "Mimi", 
    deceased: "ON", 
    birthday: "2018-1-1" }, 
    { type: AnimalClass }) 
```

## Convert Array 
Convert into array by providing array of type in the expected type.

```typescript
import {convert} from "typedconverter";

const numb = await convert(["1", "2", "-3"], { type: [Number] })
```

## Convert Child Array
Nested child array need to be decorate for TypeScript added design data type

```typescript
import {convert} from "typedconverter";

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

//tags is instance of Tag class
const numb = await convert({name: "Mimi", tags: [{name: "Susi"}, {name: "Lorem"}]}, { type: Animal })
```

## Guess Array Element
Useful when converting data from url encoded, where single value could be a single array. 

```typescript
const b = await convert("1", { type: [Number] }) //ok [1]
```


## Visitors
Visitors executed after conversion process traverse through properties / array element. Invocation can be multiple and run in sequence the last sequence will execute the converter. Visitors work like [Plumier middleware](https://plumierjs.com/docs/middleware)

Signature of Visitor is like below: 

```typescript
type Visitor = (invocation: VisitorInvocation) => VisitorResult
```

Visitor is a function receive two parameters `value` and `invocation`. 
* `invocation` next invocation 

```typescript
import createConverter, {Result} from "typedconverter"

const olderThanEightTeen = (i: VisitorInvocation) => {
    if (i.type === Number && i.value < 18)
        return Result.error(i.path, "Must be older than 18")
    else
        return i.proceed()
}

const convert = createConverter({ type: Number, visitors: [olderThanEightTeen] })
const result = convert("40") // { value: 40 }
const other = convert("12") // { issues: [{path: "", messages: ["Must be older than 18"]}]  }
```


