# Yet Another Result Monad

[![npm version](https://badge.fury.io/js/yet-another-result-monad.svg)](https://badge.fury.io/js/yet-another-result-monad)

A `Result` Monad, fully typed with zero dependencies, that let's you handle failing scenarios in a graceful way.
Inspired by [Resut Result Monad](https://doc.rust-lang.org/std/result).

## Installation

```
npm install yet-another-result-monad --save
yarn add yet-another-result-monad
```

## How to use

```typescript
import { Ok, Fail } from "yet-another-result-monad";

// Initialize a result. Types are infered
const mySuccessResult = Ok('Hello World') // Result<string, unknown>
const myFailingResult = Fail(22) // Result<unknown, number>

// Now your functions can have different return types for success and failing scenarios
const myFunction(): Result<string, number> {
    if(today === 1) return mySuccessResult;
    return myFailingResult;
}

// Opens the result. It's recommended that you only use this when really needed.
Ok('Hello').unwrap() // >> 'Hello'
Ok('Hello').unwrapFail() // >> throws

// Applies the function  the result value, transforming it's value
// If you try to mapFail a success result, it will be ignored.
Ok('Hello').map((value) => value + ' World') // >> Ok('Hello World')
Ok('Hello').mapFail((value) => value + ' Fail') // >> Ignored. Ok('Hello')

// Applies the function that returns a Result into the result value, transforming it's value
// If you try to flatMapFail a success result, it will be ignored.
Ok('Hello').flatMap((value) => Ok(value + ' World')) // >> Ok('Hello World')
Ok('Hello').flatMap((value) => Fail(value + ' World')) // >> Fail('Hello World')

Ok('Hello').flatMapFail((value) => Ok(value + ' Fail')) // >> Ignored. Ok('Hello')
```

### Ok(value) | Result.ok(value)

Creates a `Ok<T, any>` result, as T being the type of the passed value.

```ts
const myResult = Ok("Hello World");
```

### Fail(value) | Result.fail(value)

Creates a `Fail<any, T>` result, as T being the type of the passed value.

```ts
const myResult = Fail("Hello World");
```

## Merging several results into one

### Result.collect(values)

Transform a array of results into a result of that array.

```ts
const myArrayOfResults = [Ok("Hello"), Ok("World")];

const myResult = Result.collect(myArrayOfResults);

console.log(myResult.unwrap());
// [
//   'Hello',
//   'World'
// ]
```

If the array contains a failing result, returns the first failing result found.

```ts
const myArrayOfResults = [
  Ok("Hello"),
  Fail("Evil"),
  Ok("World"),
  Fail("Problem"),
];

const myResult = Result.collect(myArrayOfResults);

console.log(myResult.unwrapFail());
// 'Evil'
```

### Result.collectObject(value)

Transform a object that has Result keys into a result of that object, with plain values on it's keys.
Keys that does not contain Result are kept

```ts
const myObjectWithResults = {
  name: Ok("John"),
  age: Ok(22),
  surname: "Doe",
};

const myResult = Result.collectObject(myObjectWithResults);

console.log(myResult.unwrap());
// {
//   name: 'John',
//   age: 22,
//   surname: 'Doe'
// }
```

If the object contains a failing result, returns the first failing result found.

```ts
const myObjectWithResults = {
  name: Ok("John"),
  age: Fail(-20),
  surname: "Doe",
};

const myResult = Result.collectObject(myObjectWithResults);

console.log(myResult.unwrapFail());
// -20
```

## Get the value from Result

### .unwrap()

Returns the Ok value of the result.
Throws it this is called on a failing result.

```ts
const myResult = Ok("Hello").unwrap();
// 'Hello'

const myFailingResult = Fail("Hello").unwrap();
// throws
```

### .unwrapFail()

Returns the Failing value of the result.
Throws it this is called on a success result.

```ts
const myFailingResult = Fail("Hello").unwrapFail();
// 'Hello'

const myResult = Ok("Hello").unwrapFail();
// throws
```

## Transformations

### .map(fn)

Applies `fn` into the result Ok value, and returns a new Ok result with it.
If it's a failing result, it's ignored.

```ts
const myResult = Ok("Hello").map((value) => value + " World");
// Ok('Hello World')
```

### .mapFail(fn)

Applies `fn` into the result Fail value, and returns a new Fail result with it.
If it's a success result, it's ignored.

```ts
const myResult = Fail("Hello").mapFail((value) => value + " World");
// Fail('Hello World')
```

### .flatMap(fn)

Applies `fn` into the result Ok value. The `fn` function must return a new Result.
If it's a failing result, it's ignored.

```ts
const result = Ok("Hello").flatMap((value) => Ok(value + " World"));
// Ok('Hello World')

const resultThatNowFails = Ok("Hello").flatMap((value) =>
  Fail(value + " World")
);
// Fail('Hello World')
```

### .flatMapFail(fn)

Applies `fn` into the result Fail value. The `fn` function must return a new Result.
If it's a success result, it's ignored.

```ts
const result = Fail("Hello").flatMapFail((value) => Ok(value + " World"));
// Ok('Hello World')

const resultThatNowFails = Fail("Hello").flatMapFail((value) =>
  Fail(value + " World")
);
// Fail('Hello World')
```

## Async Transformations

All 4 methods have their `async` versions. They return a Promise of the result, and the transformation fn must be async.

```ts
await result.asyncMap(async value => value): Promise<Result>
await result.asyncMapFail(async value => value): Promise<Result>
await result.asyncFlatMap(async value => value): Promise<Result>
await result.asyncFlatMapFail(async value => value): Promise<Result>
```
