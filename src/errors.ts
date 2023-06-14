export class NoOkValueError extends Error {
  constructor() {
    super("Cannot unwrap a failed result");
    this.name = "NoOkValueError";
  }
}

export class NoFailValueError extends Error {
  constructor() {
    super("Cannot unwrapFail a successful result");
    this.name = "NoFailValueError";
  }
}

