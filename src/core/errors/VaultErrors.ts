export class DepositLimitExceededError extends Error {
  public readonly name = "DepositLimitExceededError";
  public readonly attempted: bigint;
  public readonly maximum: bigint;

  constructor(attempted: bigint, maximum: bigint) {
    super(`Deposit amount ${attempted} exceeds maximum allowed ${maximum}`);
    this.attempted = attempted;
    this.maximum = maximum;
  }
}

export class BelowMinimumDepositError extends Error {
  public readonly name = "BelowMinimumDepositError";
  public readonly attempted: bigint;
  public readonly minimum: bigint;

  constructor(attempted: bigint, minimum: bigint) {
    super(`Deposit amount ${attempted} is below minimum required ${minimum}`);
    this.attempted = attempted;
    this.minimum = minimum;
  }
}

export class WithdrawError extends Error {
  public readonly name = "WithdrawError";
  public readonly reason: string;

  constructor(reason: string) {
    super(`Withdraw failed: ${reason}`);
    this.reason = reason;
  }
}

export class VaultNotInitializedError extends Error {
  public readonly name = "VaultNotInitializedError";

  constructor() {
    super("Vault has not been initialized");
  }
}
