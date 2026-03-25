import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
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

const VAULT_ABI = [
  {
    name: "deposit",
    type: "function",
    inputs: [],
    outputs: [],
    stateMutability: "payable",
  },
  {
    name: "withdraw",
    type: "function",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    name: "getBalance",
    type: "function",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    name: "owner",
    type: "function",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
] as const;

export class VaultService implements IVault {
  private readonly walletAgent: IWalletAgent;
  private readonly config: VaultConfig;
  private readonly operationHistory: VaultOperation[] = [];
  private readonly publicClient: ReturnType<typeof createPublicClient>;
  private readonly walletClient: ReturnType<typeof createWalletClient>;
  private readonly walletAddress: `0x${string}`;

  constructor(walletAgent: IWalletAgent, config: VaultConfig) {
    this.walletAgent = walletAgent;
    this.config = config;

    const rpcUrl = process.env.RPC_URL ?? "https://rpc.xlayer.tech";
    const privateKey = process.env.PRIVATE_KEY as `0x${string}`;

    this.publicClient = createPublicClient({
      chain: {
        id: 196,
        name: "X Layer",
        nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
        rpcUrls: { default: { http: [rpcUrl] } },
      },
      transport: http(rpcUrl),
    });

    const account = privateKeyToAccount(privateKey);
    this.walletAddress = account.address;

    this.walletClient = createWalletClient({
      account,
      chain: {
        id: 196,
        name: "X Layer",
        nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
        rpcUrls: { default: { http: [rpcUrl] } },
      },
      transport: http(rpcUrl),
    });

    logger.info("VaultService initialized with contract", { vaultAddress: config.vaultAddress });
  }

  async deposit(tokenAddress: string, amount: bigint): Promise<TransactionReceipt> {
    this.validateDepositAmount(amount);

    logger.info("Processing deposit to contract", { tokenAddress, amount });

    const balanceBefore = await this.getVaultBalance(tokenAddress);
    logger.info("Balance before deposit", { balance: balanceBefore.toString() });

    try {
      const hash = await this.walletClient.writeContract({
        address: this.config.vaultAddress as `0x${string}`,
        abi: VAULT_ABI,
        functionName: "deposit",
        value: amount,
      });

      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash,
      });

      const txReceipt: TransactionReceipt = {
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        blockHash: receipt.blockHash,
        status: receipt.status === "success",
        gasUsed: receipt.gasUsed,
        cumulativeGasUsed: receipt.cumulativeGasUsed,
        logs: receipt.logs.map((log) => ({
          address: log.address,
          data: log.data,
          topics: log.topics,
          logIndex: BigInt(log.logIndex),
        })),
      };

      this.recordOperation("deposit", amount, tokenAddress, txReceipt.transactionHash);

      const balanceAfter = await this.getVaultBalance(tokenAddress);
      logger.info("Deposit completed", { txHash: txReceipt.transactionHash, balanceAfter: balanceAfter.toString() });

      return txReceipt;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("Deposit failed", { error: message });
      throw error;
    }
  }

  async withdraw(
    tokenAddress: string,
    amount: bigint,
    recipient: string
  ): Promise<TransactionReceipt> {
    await this.validateWithdrawBalance(tokenAddress, amount);

    logger.info("Processing withdrawal from contract", { tokenAddress, amount, recipient });

    const balanceBefore = await this.getVaultBalance(tokenAddress);
    logger.info("Balance before withdrawal", { balance: balanceBefore.toString() });

    try {
      const hash = await this.walletClient.writeContract({
        address: this.config.vaultAddress as `0x${string}`,
        abi: VAULT_ABI,
        functionName: "withdraw",
        args: [amount],
      });

      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash,
      });

      const txReceipt: TransactionReceipt = {
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        blockHash: receipt.blockHash,
        status: receipt.status === "success",
        gasUsed: receipt.gasUsed,
        cumulativeGasUsed: receipt.cumulativeGasUsed,
        logs: receipt.logs.map((log) => ({
          address: log.address,
          data: log.data,
          topics: log.topics,
          logIndex: BigInt(log.logIndex),
        })),
      };

      this.recordOperation(
        "withdraw",
        amount,
        tokenAddress,
        txReceipt.transactionHash,
        recipient
      );

      const balanceAfter = await this.getVaultBalance(tokenAddress);
      logger.info("Withdrawal completed", { txHash: txReceipt.transactionHash, balanceAfter: balanceAfter.toString() });

      return txReceipt;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("Withdrawal failed", { error: message });
      throw error;
    }
  }

  async getVaultBalance(tokenAddress: string): Promise<bigint> {
    if (tokenAddress.toLowerCase() === NATIVE_TOKEN.toLowerCase()) {
      const balance = await this.publicClient.readContract({
        address: this.config.vaultAddress as `0x${string}`,
        abi: VAULT_ABI,
        functionName: "getBalance",
      });
      return balance as bigint;
    }
    return 0n;
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
    const balance = await this.getVaultBalance(tokenAddress);
    if (balance < amount) {
      throw new WithdrawError(
        `Insufficient balance: have ${balance}, need ${amount}`
      );
    }
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
