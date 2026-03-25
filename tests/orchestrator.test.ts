import { describe, it, expect, vi, beforeEach } from "vitest";
import { AgentOrchestrator } from "../src/orchestrator/AgentOrchestrator.js";
import type { IWalletAgent } from "../src/core/interfaces/IWalletAgent.js";
import type { IVault } from "../src/core/interfaces/IVault.js";
import type { IPaymentHandler } from "../src/core/interfaces/IPaymentHandler.js";

describe("AgentOrchestrator", () => {
  let mockWalletAgent: IWalletAgent;
  let mockVault: IVault;
  let mockPaymentHandler: IPaymentHandler;

  beforeEach(() => {
    mockWalletAgent = {
      connect: vi.fn().mockResolvedValue(undefined),
      getBalance: vi.fn().mockResolvedValue(1000000n),
      simulateTransaction: vi.fn().mockResolvedValue({ success: true }),
      executeTransaction: vi.fn().mockResolvedValue({
        transactionHash: "0xabc",
        blockNumber: 1n,
        blockHash: "0xhash",
        status: true,
        gasUsed: 21000n,
        cumulativeGasUsed: 21000n,
        logs: [],
      }),
    };

    mockVault = {
      deposit: vi.fn(),
      withdraw: vi.fn(),
      getVaultBalance: vi.fn().mockResolvedValue(10000000000000000000n),
      getDepositHistory: vi.fn().mockResolvedValue([]),
    };

    mockPaymentHandler = {
      handlePayment: vi.fn(),
      verifyPayment: vi.fn().mockResolvedValue(true),
      getPaymentHistory: vi.fn().mockResolvedValue([]),
    };
  });

  describe("getStatus", () => {
    it("retorna 'idle' antes de start()", () => {
      const orchestrator = new AgentOrchestrator(
        mockWalletAgent,
        mockVault,
        mockPaymentHandler
      );

      expect(orchestrator.getStatus()).toBe("idle");
    });

    it("retorna 'running' después de start()", async () => {
      const orchestrator = new AgentOrchestrator(
        mockWalletAgent,
        mockVault,
        mockPaymentHandler
      );

      await orchestrator.start();
      expect(orchestrator.getStatus()).toBe("running");
    });

    it("retorna 'stopped' después de stop()", async () => {
      const orchestrator = new AgentOrchestrator(
        mockWalletAgent,
        mockVault,
        mockPaymentHandler
      );

      await orchestrator.start();
      await orchestrator.stop();
      expect(orchestrator.getStatus()).toBe("stopped");
    });
  });

  describe("runCycle", () => {
    it("retorna 'vault_healthy' cuando balance > threshold", async () => {
      mockVault.getVaultBalance = vi.fn().mockResolvedValue(
        BigInt(10000000000000000000)
      );

      const orchestrator = new AgentOrchestrator(
        mockWalletAgent,
        mockVault,
        mockPaymentHandler
      );
      await orchestrator.start();

      const result = await orchestrator.runCycle();

      expect(result.action).toBe("vault_healthy");
      expect(result.success).toBe(true);
    });

    it("retorna 'low_balance_alert' cuando balance < threshold", async () => {
      mockVault.getVaultBalance = vi.fn().mockResolvedValue(
        BigInt(500000000000000000)
      );

      const orchestrator = new AgentOrchestrator(
        mockWalletAgent,
        mockVault,
        mockPaymentHandler
      );
      await orchestrator.start();

      const result = await orchestrator.runCycle();

      expect(result.action).toBe("low_balance_alert");
      expect(result.success).toBe(true);
    });

    it("retorna 'critical_balance' cuando balance < critical threshold", async () => {
      mockVault.getVaultBalance = vi.fn().mockResolvedValue(
        BigInt(10000000)
      );

      const orchestrator = new AgentOrchestrator(
        mockWalletAgent,
        mockVault,
        mockPaymentHandler
      );
      await orchestrator.start();

      const result = await orchestrator.runCycle();

      expect(result.action).toBe("critical_balance");
      expect(result.success).toBe(false);
    });
  });
});
