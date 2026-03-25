import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import type {
  IWalletAgent,
  TransactionRequest,
  SimulationResult,
  TransactionReceipt,
} from "../core/interfaces/IWalletAgent.js";
import {
  InsufficientFundsError,
  TransactionSimulationError,
  WalletConnectionError,
} from "../core/errors/WalletErrors.js";
import { logger } from "../utils/logger.js";

const NATIVE_TOKEN_ADDRESS = "0x0000000000000000000000000000000000000000";

export class OKXAgenticWallet implements IWalletAgent {
  private readonly privateKey: string;
  private readonly rpcUrl: string;
  private readonly publicClient: ReturnType<typeof createPublicClient>;
  private readonly walletClient: ReturnType<typeof createWalletClient>;
  private readonly walletAddress: `0x${string}`;
  private connected: boolean = false;

  constructor() {
    const privateKey = process.env.PRIVATE_KEY;
    const rpcUrl = process.env.RPC_URL;

    if (!privateKey) {
      throw new WalletConnectionError("PRIVATE_KEY not found in environment");
    }
    if (!rpcUrl) {
      throw new WalletConnectionError("RPC_URL not found in environment");
    }

    this.privateKey = privateKey;
    this.rpcUrl = rpcUrl;

    this.publicClient = createPublicClient({
      chain: {
        id: 196,
        name: "X Layer",
        nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
        rpcUrls: { default: { http: [rpcUrl] } },
      },
      transport: http(rpcUrl),
    });

    const account = privateKeyToAccount(privateKey as `0x${string}`);
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

    logger.info("OKXAgenticWallet configured", {
      rpcUrl,
      walletAddress: this.walletAddress,
    });
  }

  async connect(): Promise<void> {
    logger.info("Connecting to wallet...");
    try {
      this.connected = true;
      logger.info("Wallet connected successfully", { address: this.walletAddress });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new WalletConnectionError(message);
    }
  }

  async getBalance(tokenAddress: string): Promise<bigint> {
    logger.debug("Getting balance", { tokenAddress, wallet: this.walletAddress });

    if (!this.connected) {
      throw new WalletConnectionError("Wallet not connected. Call connect() first.");
    }

    try {
      if (tokenAddress.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()) {
        return await this.getNativeBalance();
      }
      return await this.getErc20Balance(tokenAddress);
    } catch (error) {
      logger.error("Failed to get balance", { tokenAddress, error });
      throw error;
    }
  }

  async simulateTransaction(tx: TransactionRequest): Promise<SimulationResult> {
    logger.debug("Simulating transaction", { to: tx.to, value: tx.value });

    if (!this.connected) {
      throw new WalletConnectionError("Wallet not connected. Call connect() first.");
    }

    try {
      if (tx.value !== undefined && tx.value > 0n) {
        await this.validateSufficientBalance(tx.value, NATIVE_TOKEN_ADDRESS);
      }

      const gasEstimate = await this.estimateGas(tx);
      
      return {
        success: true,
        gasUsed: gasEstimate,
      };
    } catch (error) {
      if (error instanceof InsufficientFundsError) {
        logger.error("Transaction simulation failed: insufficient funds");
        throw new TransactionSimulationError(tx, error.message);
      }
      const reason = error instanceof Error ? error.message : "Unknown error";
      logger.error("Transaction simulation failed", { reason });
      throw new TransactionSimulationError(tx, reason);
    }
  }

  async executeTransaction(tx: TransactionRequest): Promise<TransactionReceipt> {
    logger.info("Executing transaction", { to: tx.to, value: tx.value });

    if (!this.connected) {
      throw new WalletConnectionError("Wallet not connected. Call connect() first.");
    }

    const simulationResult = await this.simulateTransaction(tx);
    
    if (!simulationResult.success) {
      throw new TransactionSimulationError(
        tx,
        simulationResult.revertReason || "Simulation failed"
      );
    }

    try {
      const txHash = await this.sendRawTransaction(tx);
      
      return await this.waitForTransactionReceipt(txHash);
    } catch (error) {
      if (error instanceof TransactionSimulationError) {
        throw error;
      }
      const reason = error instanceof Error ? error.message : "Unknown error";
      throw new TransactionSimulationError(tx, reason);
    }
  }

  private async validateSufficientBalance(
    required: bigint,
    tokenAddress: string
  ): Promise<void> {
    const available = await this.getBalance(tokenAddress);
    
    if (available < required) {
      throw new InsufficientFundsError(required, available, tokenAddress);
    }
    
    logger.debug("Balance validated", { required, available });
  }

  private async getNativeBalance(): Promise<bigint> {
    return this.publicClient.getBalance({ address: this.walletAddress as `0x${string}` });
  }

  private async getErc20Balance(tokenAddress: string): Promise<bigint> {
    const abi = [
      {
        name: "balanceOf",
        type: "function",
        inputs: [{ name: "owner", type: "address" }],
        outputs: [{ name: "balance", type: "uint256" }],
        stateMutability: "view",
      },
    ];

    const result = await this.publicClient.readContract({
      address: tokenAddress as `0x${string}`,
      abi,
      functionName: "balanceOf",
      args: [this.walletAddress as `0x${string}`],
    });

    return result as bigint;
  }

  private async estimateGas(tx: TransactionRequest): Promise<bigint> {
    try {
      const gas = await this.publicClient.estimateGas({
        account: this.walletAddress as `0x${string}`,
        to: tx.to as `0x${string}`,
        value: tx.value,
        data: tx.data as `0x${string}` | undefined,
      });
      return gas;
    } catch {
      return 21000n;
    }
  }

  private async sendRawTransaction(tx: TransactionRequest): Promise<string> {
    const hash = await this.walletClient.sendTransaction({
      chain: { id: 196, name: "X Layer", nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 }, rpcUrls: { default: { http: [this.rpcUrl] } } },
      account: this.walletAddress,
      to: tx.to as `0x${string}`,
      value: tx.value,
      data: tx.data as `0x${string}` | undefined,
    });
    return hash;
  }

  private async waitForTransactionReceipt(
    txHash: string
  ): Promise<TransactionReceipt> {
    const receipt = await this.publicClient.waitForTransactionReceipt({
      hash: txHash as `0x${string}`,
    });

    return {
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
  }
}
