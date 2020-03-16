# TypedConverter
Convert object into classes match with TypeScript type annotation

[![Build Status](https://travis-ci.org/plumier/typedconverter.svg?branch=master)](https://travis-ci.org/plumier/typedconverter)
[![Coverage Status](https://coveralls.io/repos/github/plumier/typedconverter/badge.svg?branch=master)](https://coveralls.io/github/plumier/typedconverter?branch=master) [![Greenkeeper badge](https://badges.greenkeeper.io/plumier/typedconverter.svg)](https://greenkeeper.io/)


## Performance 
TypedConverter uses several performance optimization, first it traverse Type properties using efficient properties traversal then compiles TypeScript types into optimized object graph contains functions for conversion. 

Performance compared to Joi
```
Test Type                          Sec
Joi - Type conversion            17.62
Joi - Validation                 61.67
TypedConverter - Type conversion  7.29
TypedConverter - Validation      23.51
```

To run benchmark: 
* Clone this repo 
* `yarn install` 
* `yarn benchmark`

## Validation 

```typescript
import reflect from "tinspector"
import { createValidator, val } from "typedconverter"

@reflect.parameterProperties()
class User {
    constructor(
        @val.email()
        public email:string,
        public name:string,
        @val.before()
        public dateOfBirth:Date,
        public isActive:boolean
    ){}
}

// create validation function
const validate = createValidator(User)
// validate raw value
const user = validate({ 
    email: "john.doe@gmail.com", name: "John Doe", 
    dateOfBirth: "1991-1-2", isActive: "true" 
})

// create validation function for array
const validate = createValidator([User])
// validate raw value
const user = validate([{ 
    email: "john.doe@gmail.com", name: "John Doe", 
    dateOfBirth: "1991-1-2", isActive: "true" 
}])
```


