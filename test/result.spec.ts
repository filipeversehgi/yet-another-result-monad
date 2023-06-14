import { Result } from "../src/result";

const ERROR = "ERROR";
const OK = "OK";
const NEW_ERROR = "NEW_ERROR";
const NEW_OK = "NEW_OK";

describe("Result", () => {
  describe("collect", () => {
    it("should transform a array of results in a result of array", () => {
      const arrayOfResults = [Result.ok(OK), Result.ok(NEW_OK)];
      const resultOfArrays = Result.collect(arrayOfResults);
      expect(resultOfArrays).toEqual(Result.ok([OK, NEW_OK]));
    });

    it("should return the first failing result if the array of results contains a error", () => {
      const arrayOfResults = [
        Result.ok(OK),
        Result.fail(ERROR),
        Result.ok(NEW_OK),
        Result.fail(NEW_ERROR),
      ];
      const resultOfArrays = Result.collect(arrayOfResults);
      expect(resultOfArrays).toEqual(Result.fail(ERROR));
    });
  });

  describe("collectObject", () => {
    it("should convert where each key is a result into a result with that unwrapped object", () => {
      const objectWithResults = {
        name: Result.ok("NAME"),
        age: Result.ok(20),
      };

      const resultObject = Result.collectObject(objectWithResults);

      expect(resultObject).toEqual(
        Result.ok({
          name: "NAME",
          age: 20,
        })
      );
    });

    it("should convert where each key is a result into a result with that unwrapped object, leaving plain keys as they are", () => {
      const objectWithResults = {
        name: Result.ok("NAME"),
        surname: Result.ok("SURNAME"),
        age: Result.ok(20),
      };

      const resultObject = Result.collectObject(objectWithResults);

      expect(resultObject).toEqual(
        Result.ok({
          name: "NAME",
          surname: "SURNAME",
          age: 20,
        })
      );
    });

    it("should return the first error if one of the object keys has a failing result", () => {
      const objectWithResults = {
        name: Result.ok("NAME"),
        surname: Result.ok("SURNAME"),
        age: Result.fail(ERROR),
      };

      const resultObject = Result.collectObject(objectWithResults);

      expect(resultObject).toEqual(Result.fail(ERROR));
    });
  });

  describe("fail", () => {
    const result = Result.fail(ERROR);

    it("should create a proper failure result", () => {
      expect(result.isFail()).toBe(true);
      expect(result.isOk()).toBe(false);
    });

    it("should throw if trying to unwrap the ok value", () => {
      expect(() => result.unwrap()).toThrow();
    });

    it("should get the original error on unwrap", () => {
      expect(result.unwrapFail()).toBe(ERROR);
    });

    describe("when applying a fail modifier", () => {
      it("should map the fail value according to the callback", () => {
        expect(result.mapFail(() => NEW_ERROR).unwrapFail()).toBe(NEW_ERROR);
      });

      it("should transform the result into a new ok result on flatMap", () => {
        const newResult = result.flatMapFail(() => Result.ok(NEW_OK));
        expect(newResult.isOk()).toBe(true);
        expect(newResult.unwrap()).toBe(NEW_OK);
      });

      it("should transform the result into a new fail result on flatMap", () => {
        const newResult = result.flatMapFail(() => Result.fail(NEW_ERROR));
        expect(newResult.isFail()).toBe(true);
        expect(newResult.unwrapFail()).toBe(NEW_ERROR);
      });

      it("should async map the ok value according to the callback", async () => {
        const newResult = await result.asyncMapFail(async () => NEW_ERROR);
        expect(newResult.unwrapFail()).toBe(NEW_ERROR);
      });

      it("should async transform the result into a new ok result on asyncFlatMap", async () => {
        const newResult = await result.asyncFlatMapFail(async () =>
          Result.ok(NEW_OK)
        );
        expect(newResult.isOk()).toBe(true);
        expect(newResult.unwrap()).toBe(NEW_OK);
      });

      it("should async transform the result into a new fail result on asyncFlatMap", async () => {
        const newResult = await result.asyncFlatMapFail(async () =>
          Result.fail(NEW_ERROR)
        );
        expect(newResult.isFail()).toBe(true);
        expect(newResult.unwrapFail()).toBe(NEW_ERROR);
      });
    });

    describe("when applying ok modifiers", () => {
      it("should keep the original ok result after a map", () => {
        const newResult = result.map(() => Result.fail(NEW_ERROR));
        expect(newResult).toEqual(result);
      });

      it("should keep the original ok result after a flatMap", () => {
        const newResult = result.flatMap(() => Result.fail(NEW_ERROR));
        expect(newResult).toEqual(result);
      });

      it("should keep the original ok result after a asyncMap", async () => {
        const newResult = await result.asyncMap(async () =>
          Result.fail(NEW_ERROR)
        );
        expect(newResult).toEqual(result);
      });

      it("should keep the original ok result after a asyncFlatMap", async () => {
        const newResult = await result.asyncFlatMap(async () =>
          Result.fail(NEW_ERROR)
        );
        expect(newResult).toEqual(result);
      });
    });
  });

  describe("ok", () => {
    const result = Result.ok(OK);
    it("should create a proper ok result", () => {
      expect(result.isOk()).toBe(true);
      expect(result.isFail()).toBe(false);
    });

    it("should throw if trying to unwrap the fail value", () => {
      expect(() => result.unwrapFail()).toThrow();
    });

    it("should get the original content on unwrap", () => {
      expect(result.unwrap()).toBe(OK);
    });

    describe("when applying a ok modifier", () => {
      it("should map the ok value according to the callback", () => {
        expect(result.map(() => NEW_OK).unwrap()).toBe(NEW_OK);
      });

      it("should transform the result into a new ok result on flatMap", () => {
        const newResult = result.flatMap(() => Result.ok(NEW_OK));
        expect(newResult.isOk()).toBe(true);
        expect(newResult.unwrap()).toBe(NEW_OK);
      });

      it("should transform the result into a new fail result on flatMap", () => {
        const newResult = result.flatMap(() => Result.fail(NEW_ERROR));
        expect(newResult.isFail()).toBe(true);
        expect(newResult.unwrapFail()).toBe(NEW_ERROR);
      });

      it("should async map the ok value according to the callback", async () => {
        const newResult = await result.asyncMap(async () => NEW_OK);
        expect(newResult.unwrap()).toBe(NEW_OK);
      });

      it("should async transform the result into a new ok result on asyncFlatMap", async () => {
        const newResult = await result.asyncFlatMap(async () =>
          Result.ok(NEW_OK)
        );
        expect(newResult.isOk()).toBe(true);
        expect(newResult.unwrap()).toBe(NEW_OK);
      });

      it("should async transform the result into a new fail result on asyncFlatMap", async () => {
        const newResult = await result.asyncFlatMap(async () =>
          Result.fail(NEW_ERROR)
        );
        expect(newResult.isFail()).toBe(true);
        expect(newResult.unwrapFail()).toBe(NEW_ERROR);
      });
    });

    describe("when applying *fail modifiers", () => {
      it("should keep the original ok result after a mapFail", () => {
        const newResult = result.mapFail(() => Result.fail(NEW_ERROR));
        expect(newResult).toEqual(result);
      });

      it("should keep the original ok result after a flatMapFail", () => {
        const newResult = result.flatMapFail(() => Result.fail(NEW_ERROR));
        expect(newResult).toEqual(result);
      });

      it("should keep the original ok result after a asyncMapFail", async () => {
        const newResult = await result.asyncMapFail(async () =>
          Result.fail(NEW_ERROR)
        );
        expect(newResult).toEqual(result);
      });

      it("should keep the original ok result after a asyncFlatMapFail", async () => {
        const newResult = await result.asyncFlatMapFail(async () =>
          Result.fail(NEW_ERROR)
        );
        expect(newResult).toEqual(result);
      });
    });
  });
});
