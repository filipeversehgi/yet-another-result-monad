enum ResultType {
  Fail,
  Ok,
}

export type AsyncResult<S, E> = Promise<Result<S, E>>;

export type TCollectResult<T> = Result<
  { [key in keyof T]: T[key] extends Result<infer A, any> ? A : T[key] },
  { [key in keyof T]: T[key] extends Result<any, infer B> ? B : never }[keyof {
    [key in keyof T]: T[key] extends Result<any, infer B> ? B : never;
  }]
>;

export class Result<S, E> {
  private constructor(
    private _type: ResultType,
    private _data: S,
    private _error: E
  ) {}

  /**
   * Produces a Failing Result instance
   * @param error
   * @returns
   */
  static fail<E>(error: E): Result<any, E> {
    return new Result(ResultType.Fail, null, error);
  }

  /**
   * Produces a Ok Result Instance
   * @param data
   * @returns
   */
  static ok<S>(data: S): Result<S, any> {
    return new Result(ResultType.Ok, data, null);
  }

  /**
   * Collects a array of Results into a Result of Array,
   * or outputs the first Failing Result.
   * Ignores non-result types from the generated array
   * @param results
   * @returns
   */
  // static collect<T extends [...any[]]>(
  //   results: [...T],
  // ): Result<
  //   ExcludeFromTuple<UnwrapResults<T>, never>,
  //   ToupleToUnion<ExcludeFromTuple<UnwrapResultsError<T>, never>>
  // > {
  static collect<T, E>(results: Array<Result<T, E>>): Result<T[], E> {
    const errors = results
      .filter(Result.isResult)
      .filter((result) => result.isFail())
      .map((result) => result.unwrapFail());

    if (errors.length > 0) {
      return Result.fail(errors[0]) as Result<T[], E>;
    }

    const resultContent = results
      .filter(Result.isResult)
      .map((r) => r.unwrap());
    return Ok(resultContent) as Result<T[], E>;
  }

  /**
   * Collects a object os key: Result<T, E> into a Result<key: T, E>, and
   * E being the first Failing result
   * If a object key contains something that's not a Result, the value is kept
   * in the final object Ok
   * @param obj
   * @returns
   */
  static collectObject<T>(obj: {
    [key in keyof T]: T[key];
  }): TCollectResult<T> {
    const errors = (Object.values(obj) as Result<any, any>[])
      .filter(Result.isResult)
      .filter((result) => result.isFail())
      .map((result) => result.unwrapFail());

    if (errors.length > 0) {
      return Result.fail(errors[0]) as TCollectResult<T>;
    }

    return Result.ok(
      Object.entries(obj).reduce((acc, cur) => {
        const [key, value] = cur;

        if (!Result.isResult(value)) {
          acc[key] = value;
          return acc;
        }

        acc[key] = value.unwrap();
        return acc;
      }, {} as { [key: string]: any })
    ) as TCollectResult<T>;
  }

  static isResult(result: any | Result<any, any>): result is Result<any, any> {
    return !!result && !!result.isFail && !!result.isOk;
  }

  /**
   * Returns True is Result is Ok
   * @returns boolean
   */
  isOk(): boolean {
    return this._type === ResultType.Ok;
  }

  /**
   * Returns true is Result is Fail
   * @returns boolean
   */
  isFail(): boolean {
    return this._type === ResultType.Fail;
  }

  /**
   * Unwraps the Ok value of a Result, throws otherwise
   * @returns boolean
   */
  unwrap(): S {
    if (!this.isOk()) throw "";
    return this._data;
  }

  /**
   * Unwraps the Fail value of a Result, throws otherwise
   * @returns boolean
   */
  unwrapFail(): E {
    if (!this.isFail()) throw "";
    return this._error;
  }

  /**
   * Applies a function into the Ok value of the result while propagating the Fail
   * @param transform
   * @returns
   */
  map<NewS>(transform: (data: S) => NewS): Result<NewS, E> {
    if (!this.isOk()) return Result.fail(this._error);
    const newData = transform(this._data);
    return Result.ok(newData);
  }

  /**
   * Applies a function into the Fail value of the result while propagating the Ok
   * @param transform
   * @returns
   */
  mapFail<NewE>(transform: (error: E) => NewE): Result<S, NewE> {
    if (!this.isFail()) return Result.ok(this._data);
    const newError = transform(this._error);
    return Result.fail(newError);
  }

  /**
   * Applies a function that returns a result into the Ok value of the result, if Failing, can return the original Fail or the new Fail
   * @param transform
   * @returns
   */
  flatMap<NewS, NewE>(
    transform: (data: S) => Result<NewS, NewE>
  ): Result<NewS, E | NewE> {
    if (!this.isOk()) return Result.fail(this._error);
    const newData = transform(this._data);
    if (newData.isFail()) return Result.fail(newData.unwrapFail());
    return Result.ok(newData.unwrap());
  }

  /**
   * Applies a function that returns a result into the Fail value of the result, if Ok, can return the original Ok or the new Ok
   * @param transform
   * @returns
   */
  flatMapFail<NewS, NewE>(
    transform: (error: E) => Result<NewS, NewE>
  ): Result<S | NewS, NewE> {
    if (!this.isFail()) return Result.ok(this._data);
    const newError = transform(this._error);
    if (newError.isOk()) return Result.ok(newError.unwrap());
    return Result.fail(newError.unwrapFail());
  }

  /**
   * Applies a async function into the Ok value of the result while propagating the Fail
   * Returns the Result as a Promise
   * @param transform
   * @returns
   */
  async asyncMap<NewS>(
    transform: (data: S) => Promise<NewS>
  ): Promise<Result<NewS, E>> {
    if (!this.isOk()) return Result.fail(this._error);
    const newData = await transform(this._data);
    return Result.ok(newData);
  }

  /**
   * Applies a async function into the Fail value of the result while propagating the Ok
   * Returns the Result as a Promise
   * @param transform
   * @returns
   */
  async asyncMapFail<NewE>(
    transform: (error: E) => Promise<NewE>
  ): Promise<Result<S, NewE>> {
    if (!this.isFail()) return Result.ok(this._data);
    const newError = await transform(this._error);
    return Result.fail(newError);
  }

  /**
   * Applies a async function that returns a result into the Ok value of the result, if Failing, can return the original Fail or the new Fail
   * Returns the Result as a Promise
   * @param transform
   * @returns
   */
  async asyncFlatMap<NewS, NewE>(
    transform: (data: S) => Promise<Result<NewS, NewE>>
  ): Promise<Result<NewS, E | NewE>> {
    if (!this.isOk()) return Result.fail(this._error);
    const newData = await transform(this._data);
    if (newData.isFail()) return Result.fail(newData.unwrapFail());
    return Result.ok(newData.unwrap());
  }

  /**
   * Applies a async function that returns a result into the Fail value of the result, if Ok, can return the original Ok or the new Ok
   * Returns the Result as a Promise
   * @param transform
   * @returns
   */
  async asyncFlatMapFail<NewS, NewE>(
    transform: (error: E) => Promise<Result<NewS, NewE>>
  ): Promise<Result<S | NewS, NewE>> {
    if (!this.isFail()) return Result.ok(this._data);
    const newError = await transform(this._error);
    if (newError.isOk()) return Result.ok(newError.unwrap());
    return Result.fail(newError.unwrapFail());
  }
}

export const Fail = Result.fail;
export const Ok = Result.ok;
