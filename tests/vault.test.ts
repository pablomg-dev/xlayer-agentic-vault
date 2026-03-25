import { describe, it, expect, vi, beforeEach } from "vitest";
import { VaultService, type VaultClients } from "../src/vault/VaultService.js";
import type { IWalletAgent } from "../src/core/interfaces/IWalletAgent.js";
import type { VaultConfig } from "../src/core/interfaces/IVault.js";
import {
  DepositLimitExceededError,
  BelowMinimumDepositError,
  WithdrawError,
} from "../src/core/errors/VaultErrors.js";
import type { TransactionReceipt } from "../src/core/interfaces/IWalletAgent.js";

describe("VaultService", () => {
  let mockWalletAgent: IWalletAgent;
  let vaultConfig: VaultConfig;
  const mockReceipt: TransactionReceipt = {
    transactionHash: "0x123",
    blockNumber: 1n,
    blockHash: "0xabc",
    status: true,
    gasUsed: 21000n,
    cumulativeGasUsed: 21000n,
    logs: [],
  };

  const createMockClients = (contractBalance: bigint = 0n): VaultClients => ({
    publicClient: {
      readContract: vi.fn().mockResolvedValue(contractBalance),
      waitForTransactionReceipt: vi.fn().mockResolvedValue({
        transactionHash: "0x123",
        blockNumber: 1n,
        blockHash: "0xabc",
        status: "success",
        gasUsed: 21000n,
        cumulativeGasUsed: 21000n,
        logs: [],
      }),
    } as any,
    walletClient: {
      writeContract: vi.fn().mockResolvedValue("0x123"),
    } as any,
    walletAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb1",
  });

  beforeEach(() => {
    mockWalletAgent = {
      connect: vi.fn().mockResolvedValue(undefined),
      getBalance: vi.fn().mockResolvedValue(1000000n),
      simulateTransaction: vi.fn().mockResolvedValue({ success: true }),
      executeTransaction: vi.fn().mockResolvedValue(mockReceipt),
    };

    vaultConfig = {
      vaultAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb1",
      maxDepositAmount: 1000000n,
      minDepositAmount: 100n,
    };
  });

  describe("deposit", () => {
    it("lanza DepositLimitExceededError si amount > maxDepositAmount", async () => {
      const vault = new VaultService(mockWalletAgent, vaultConfig, createMockClients());

      await expect(
        vault.deposit("0x0000000000000000000000000000000000000000", 2000000n)
      ).rejects.toThrow(DepositLimitExceededError);
    });

    it("lanza BelowMinimumDepositError si amount < minDepositAmount", async () => {
      const vault = new VaultService(mockWalletAgent, vaultConfig, createMockClients());

      await expect(
        vault.deposit("0x0000000000000000000000000000000000000000", 50n)
      ).rejects.toThrow(BelowMinimumDepositError);
    });

    it("depósito exitoso agrega entrada al historial", async () => {
      const vault = new VaultService(mockWalletAgent, vaultConfig, createMockClients());

      await vault.deposit("0x0000000000000000000000000000000000000000", 500000n);

      const history = await vault.getDepositHistory(
        "0x0000000000000000000000000000000000000000"
      );
      expect(history).toHaveLength(1);
      expect(history[0]?.type).toBe("deposit");
      expect(history[0]?.amount).toBe(500000n);
    });
  });

  describe("withdraw", () => {
    it("lanza WithdrawError si balance insuficiente", async () => {
      const vault = new VaultService(mockWalletAgent, vaultConfig, createMockClients(100n));

      await expect(
        vault.withdraw(
          "0x0000000000000000000000000000000000000000",
          500n,
          "0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb1"
        )
      ).rejects.toThrow(WithdrawError);
    });
  });

  describe("getVaultBalance", () => {
    it("retorna el balance del contrato via viem", async () => {
      const mockClients = createMockClients(500n);
      const vault = new VaultService(mockWalletAgent, vaultConfig, mockClients);

      const balance = await vault.getVaultBalance(
        "0x0000000000000000000000000000000000000000"
      );

      expect(mockClients.publicClient?.readContract).toHaveBeenCalled();
      expect(balance).toBe(500n);
    });
  });
});
