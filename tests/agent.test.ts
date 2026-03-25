import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { OKXAgenticWallet } from "../src/agents/OKXAgenticWallet.js";
import { InsufficientFundsError } from "../src/core/errors/WalletErrors.js";
import { WalletConnectionError } from "../src/core/errors/WalletErrors.js";
import { TransactionSimulationError } from "../src/core/errors/WalletErrors.js";

vi.mock("@okxweb3/coin-ethereum", () => ({
  default: vi.fn(),
}));

describe("OKXAgenticWallet", () => {
  const originalEnv = process.env;
  const testPrivateKey = "0x4d3418816dc6ecb93d9b9b076165b090ff0ffa75062de0b4f4180cf0a2e07003";

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("constructor", () => {
    it("lanza WalletConnectionError si falta PRIVATE_KEY", () => {
      delete process.env.PRIVATE_KEY;
      process.env.RPC_URL = "https://rpc.xlayer.tech";

      expect(() => new OKXAgenticWallet()).toThrow(WalletConnectionError);
    });

    it("lanza WalletConnectionError si falta RPC_URL", () => {
      process.env.PRIVATE_KEY = testPrivateKey;
      delete process.env.RPC_URL;

      expect(() => new OKXAgenticWallet()).toThrow(WalletConnectionError);
    });
  });

  describe("connect", () => {
    it("lanza WalletConnectionError si la wallet no está conectada", async () => {
      process.env.PRIVATE_KEY = testPrivateKey;
      process.env.RPC_URL = "https://rpc.xlayer.tech";

      const wallet = new OKXAgenticWallet();

      await expect(wallet.getBalance("0x0000000000000000000000000000000000000000"))
        .rejects.toThrow(WalletConnectionError);
    });
  });

  describe("executeTransaction", () => {
    it("no ejecuta la transacción si simulateTransaction falla", async () => {
      process.env.PRIVATE_KEY = testPrivateKey;
      process.env.RPC_URL = "https://rpc.xlayer.tech";

      const wallet = new OKXAgenticWallet();
      await wallet.connect();

      const tx = {
        to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb1",
        value: BigInt(100000000000000000000),
      };

      await expect(wallet.executeTransaction(tx))
        .rejects.toThrow(TransactionSimulationError);
    });
  });
});
