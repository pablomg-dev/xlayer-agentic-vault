import type { TransactionReceipt } from "./IWalletAgent.js";

export type VaultOperationType = "deposit" | "withdraw";

export interface VaultOperation {
  type: VaultOperationType;
  amount: bigint;
  tokenAddress: string;
  txHash: string;
  timestamp: number;
  recipient?: string;
}

export interface VaultConfig {
  vaultAddress: string;
  maxDepositAmount: bigint;
  minDepositAmount: bigint;
}

export interface IVault {
  deposit(tokenAddress: string, amount: bigint): Promise<TransactionReceipt>;
  withdraw(
    tokenAddress: string,
    amount: bigint,
    recipient: string
  ): Promise<TransactionReceipt>;
  getVaultBalance(tokenAddress: string): Promise<bigint>;
  getDepositHistory(tokenAddress: string): Promise<VaultOperation[]>;
}
