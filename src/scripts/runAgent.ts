import * as dotenv from "dotenv";
import { VaultService } from "../vault/VaultService.js";
import { X402PaymentHandler } from "../payments/X402PaymentHandler.js";
import { AgentOrchestrator } from "../orchestrator/AgentOrchestrator.js";
import type { IWalletAgent } from "../core/interfaces/IWalletAgent.js";
import { logger } from "../utils/logger.js";

dotenv.config();

const createMockWalletAgent = (): IWalletAgent => ({
  connect: async () => {},
  getBalance: async () => BigInt(10000000000000000000),
  simulateTransaction: async () => ({ success: true }),
  executeTransaction: async () => ({
    transactionHash: "0xmock",
    blockNumber: BigInt(55644360),
    blockHash: "0xmock",
    status: true,
    gasUsed: BigInt(21000),
    cumulativeGasUsed: BigInt(21000),
    logs: [],
  }),
});

async function main(): Promise<void> {
  console.log("\n" + "=".repeat(50));
  console.log("  X Layer Agentic Vault - Demo");
  console.log("=".repeat(50) + "\n");

  logger.info("Initializing modules...");

  let wallet: IWalletAgent;

  if (process.env.PRIVATE_KEY) {
    const { OKXAgenticWallet } = await import("../agents/OKXAgenticWallet.js");
    wallet = new OKXAgenticWallet();
    await wallet.connect();
    logger.info("Wallet connected (real)");
  } else {
    wallet = createMockWalletAgent();
    await wallet.connect();
    logger.info("Wallet connected (mock)");
  }

  const vaultConfig = {
    vaultAddress: process.env.VAULT_ADDRESS ?? "0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb1",
    maxDepositAmount: BigInt(process.env.MAX_DEPOSIT_AMOUNT ?? "1000000000000000000"),
    minDepositAmount: BigInt(process.env.MIN_DEPOSIT_AMOUNT ?? "1000000000000000"),
  };
  const vault = new VaultService(wallet, vaultConfig);
  logger.info("VaultService initialized");

  const paymentHandler = new X402PaymentHandler(wallet);
  logger.info("X402PaymentHandler initialized");

  const orchestrator = new AgentOrchestrator(wallet, vault, paymentHandler);
  logger.info("AgentOrchestrator initialized");

  console.log("\n--- Starting Orchestrator ---\n");
  await orchestrator.start();

  console.log("\n--- Running 3 Autonomous Cycles ---\n");

  for (let i = 1; i <= 3; i++) {
    console.log(`\n--- Cycle ${i} ---\n`);
    const result = await orchestrator.runCycle();

    console.log("  Cycle Result:");
    console.log(`    Action:    ${result.action}`);
    console.log(`    Success:   ${result.success}`);
    console.log(`    Timestamp: ${new Date(result.timestamp).toISOString()}`);
    if (result.details) {
      console.log(`    Details:   ${result.details}`);
    }

    if (i < 3) {
      console.log("\n  Waiting 2 seconds before next cycle...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  console.log("\n--- Stopping Orchestrator ---\n");
  await orchestrator.stop();

  console.log("\n" + "=".repeat(50));
  console.log("  Demo Complete");
  console.log("=".repeat(50) + "\n");
}

main().catch((error) => {
  console.error("\nFatal error:", error);
  process.exit(1);
});
