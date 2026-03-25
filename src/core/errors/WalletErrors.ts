import type { TransactionRequest } from "../interfaces/IWalletAgent.js";

/**
 * Error thrown when the wallet has insufficient funds for a transaction.
 * Includes required and available amounts for debugging.
 */
export class InsufficientFundsError extends Error {
  public readonly name = "InsufficientFundsError";
  public readonly required: bigint;
  public readonly available: bigint;
  public readonly tokenAddress: string;

  constructor(required: bigint, available: bigint, tokenAddress: string) {
    super(
      `Insufficient funds: required ${required} wei, available ${available} wei`
    );
    this.required = required;
    this.available = available;
    this.tokenAddress = tokenAddress;
  }
}

/**
 * Error thrown when transaction simulation fails.
 * Includes the transaction that failed for debugging.
 */
export class TransactionSimulationError extends Error {
  public readonly name = "TransactionSimulationError";
  public readonly transaction: TransactionRequest;
  public readonly reason: string;

  constructor(transaction: TransactionRequest, reason: string) {
    super(`Transaction simulation failed: ${reason}`);
    this.transaction = transaction;
    this.reason = reason;
  }
}

/**
 * Error thrown when wallet connection fails.
 * Includes the reason for connection failure.
 */
export class WalletConnectionError extends Error {
  public readonly name = "WalletConnectionError";
  public readonly reason: string;

  constructor(reason: string) {
    super(`Wallet connection failed: ${reason}`);
    this.reason = reason;
  }
}
