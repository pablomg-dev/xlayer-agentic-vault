import type { IWalletAgent } from "../core/interfaces/IWalletAgent.js";
import type { IVault, VaultConfig, VaultOperation } from "../core/interfaces/IVault.js";
import type { TransactionReceipt } from "../core/interfaces/IWalletAgent.js";
import {
  DepositLimitExceededError,
  BelowMinimumDepositError,
  WithdrawError,
} from "../core/errors/VaultErrors.js";
import { logger } from "../utils/logger.js";

const NATIVE_TOKEN = "0x0000000000000000000000000000000000000000";

export class VaultService implements IVault {
  private readonly walletAgent: IWalletAgent;
  private readonly config: VaultConfig;
  private readonly operationHistory: VaultOperation[] = [];

  constructor(walletAgent: IWalletAgent, config: VaultConfig) {
    this.walletAgent = walletAgent;
    this.config = config;
    logger.info("VaultService initialized", { vaultAddress: config.vaultAddress });
  }

  async deposit(tokenAddress: string, amount: bigint): Promise<TransactionReceipt> {
    this.validateDepositAmount(amount);

    logger.info("Processing deposit", { tokenAddress, amount });

    const tx = this.buildDepositTx(tokenAddress, amount);
    const receipt = await this.walletAgent.executeTransaction(tx);

    this.recordOperation("deposit", amount, tokenAddress, receipt.transactionHash);

    logger.info("Deposit completed", { txHash: receipt.transactionHash });
    return receipt;
  }

  async withdraw(
    tokenAddress: string,
    amount: bigint,
    recipient: string
  ): Promise<TransactionReceipt> {
    await this.validateWithdrawBalance(tokenAddress, amount);

    logger.info("Processing withdrawal", { tokenAddress, amount, recipient });

    const tx = this.buildWithdrawTx(tokenAddress, amount, recipient);
    const receipt = await this.walletAgent.executeTransaction(tx);

    this.recordOperation(
      "withdraw",
      amount,
      tokenAddress,
      receipt.transactionHash,
      recipient
    );

    logger.info("Withdrawal completed", { txHash: receipt.transactionHash });
    return receipt;
  }

  async getVaultBalance(tokenAddress: string): Promise<bigint> {
    return this.walletAgent.getBalance(tokenAddress);
  }

  async getDepositHistory(tokenAddress: string): Promise<VaultOperation[]> {
    return this.operationHistory.filter((op) => op.tokenAddress === tokenAddress);
  }

  private validateDepositAmount(amount: bigint): void {
    if (amount > this.config.maxDepositAmount) {
      throw new DepositLimitExceededError(amount, this.config.maxDepositAmount);
    }
    if (amount < this.config.minDepositAmount) {
      throw new BelowMinimumDepositError(amount, this.config.minDepositAmount);
    }
  }

  private async validateWithdrawBalance(
    tokenAddress: string,
    amount: bigint
  ): Promise<void> {
    const balance = await this.walletAgent.getBalance(tokenAddress);
    if (balance < amount) {
      throw new WithdrawError(
        `Insufficient balance: have ${balance}, need ${amount}`
      );
    }
  }

  private buildDepositTx(tokenAddress: string, amount: bigint) {
    const isNative = tokenAddress.toLowerCase() === NATIVE_TOKEN;
    return {
      to: this.config.vaultAddress,
      value: isNative ? amount : 0n,
      data: isNative ? "0x" : this.encodeErc20Transfer(amount),
    };
  }

  private buildWithdrawTx(tokenAddress: string, amount: bigint, recipient: string) {
    return {
      to: tokenAddress,
      value: 0n,
      data: this.encodeErc20TransferTo(amount, recipient),
    };
  }

  private encodeErc20Transfer(amount: bigint): string {
    const methodId = "0xa9059cbb";
    const paddedAmount = amount.toString(16).padStart(64, "0");
    return `${methodId}${"0".repeat(24)}${this.config.vaultAddress.slice(2)}${paddedAmount}`;
  }

  private encodeErc20TransferTo(amount: bigint, recipient: string): string {
    const methodId = "0xa9059cbb";
    const paddedAmount = amount.toString(16).padStart(64, "0");
    return `${methodId}${recipient.slice(2).padStart(64, "0")}${paddedAmount}`;
  }

  private recordOperation(
    type: "deposit" | "withdraw",
    amount: bigint,
    tokenAddress: string,
    txHash: string,
    recipient?: string
  ): void {
    const operation: VaultOperation = {
      type,
      amount,
      tokenAddress,
      txHash,
      timestamp: Date.now(),
    };
    if (recipient) {
      operation.recipient = recipient;
    }
    this.operationHistory.push(operation);
  }
}
