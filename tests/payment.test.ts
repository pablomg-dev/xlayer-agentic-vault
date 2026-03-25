import { describe, it, expect, vi, beforeEach } from "vitest";
import { X402PaymentHandler } from "../src/payments/X402PaymentHandler.js";
import type { IWalletAgent } from "../src/core/interfaces/IWalletAgent.js";
import type { Http402Response } from "../src/core/interfaces/IPaymentHandler.js";
import {
  PaymentFailedError,
  InvalidPaymentRequestError,
} from "../src/core/errors/PaymentErrors.js";

describe("X402PaymentHandler", () => {
  let mockWalletAgent: IWalletAgent;
  const mockReceipt = {
    transactionHash: "0xabc123",
    blockNumber: 1n,
    blockHash: "0xhash",
    status: true,
    gasUsed: 21000n,
    cumulativeGasUsed: 21000n,
    logs: [],
  };

  beforeEach(() => {
    mockWalletAgent = {
      connect: vi.fn().mockResolvedValue(undefined),
      getBalance: vi.fn().mockResolvedValue(1000000n),
      simulateTransaction: vi.fn().mockResolvedValue({ success: true }),
      executeTransaction: vi.fn().mockResolvedValue(mockReceipt),
    };
  });

  describe("handlePayment", () => {
    it("lanza InvalidPaymentRequestError si amount es 0", async () => {
      const handler = new X402PaymentHandler(mockWalletAgent);
      const response: Http402Response = {
        url: "https://api.example.com",
        amount: 0n,
        tokenAddress: "0x0000000000000000000000000000000000000000",
        recipient: "0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb1",
      };

      await expect(handler.handlePayment(response)).rejects.toThrow(
        InvalidPaymentRequestError
      );
    });

    it("lanza PaymentFailedError si la transacción falla", async () => {
      mockWalletAgent.executeTransaction = vi.fn().mockRejectedValue(
        new Error("Transaction reverted")
      );
      const handler = new X402PaymentHandler(mockWalletAgent);
      const response: Http402Response = {
        url: "https://api.example.com",
        amount: 1000000n,
        tokenAddress: "0x0000000000000000000000000000000000000000",
        recipient: "0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb1",
      };

      await expect(handler.handlePayment(response)).rejects.toThrow(
        PaymentFailedError
      );
    });

    it("pago exitoso es agregado al historial", async () => {
      const handler = new X402PaymentHandler(mockWalletAgent);
      const response: Http402Response = {
        url: "https://api.example.com",
        amount: 1000000n,
        tokenAddress: "0x0000000000000000000000000000000000000000",
        recipient: "0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb1",
      };

      await handler.handlePayment(response);
      const history = await handler.getPaymentHistory();

      expect(history).toHaveLength(1);
      expect(history[0]?.url).toBe("https://api.example.com");
      expect(history[0]?.amount).toBe(1000000n);
    });
  });

  describe("verifyPayment", () => {
    it("retorna false para txHash desconocido", async () => {
      const handler = new X402PaymentHandler(mockWalletAgent);

      const result = await handler.verifyPayment("0xunknown");

      expect(result).toBe(false);
    });

    it("retorna true para txHash conocido con éxito", async () => {
      const handler = new X402PaymentHandler(mockWalletAgent);
      const response: Http402Response = {
        url: "https://api.example.com",
        amount: 1000000n,
        tokenAddress: "0x0000000000000000000000000000000000000000",
        recipient: "0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb1",
      };

      await handler.handlePayment(response);
      const result = await handler.verifyPayment("0xabc123");

      expect(result).toBe(true);
    });
  });
});
