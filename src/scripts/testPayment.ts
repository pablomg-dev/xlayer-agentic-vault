import * as dotenv from "dotenv";
import { X402PaymentHandler } from "../payments/X402PaymentHandler.js";
import type { Http402Response } from "../core/interfaces/IPaymentHandler.js";
import { logger } from "../utils/logger.js";

dotenv.config();

const mockHttp402Response: Http402Response = {
  url: "https://api.xlayer.example.com/data",
  amount: BigInt(1000000000000000),
  tokenAddress: "0x0000000000000000000000000000000000000000",
  recipient: "0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb1",
  memo: "Payment for API access",
};

const mockWalletAgent = {
  connect: async () => {},
  getBalance: async () => BigInt(1000000000000000000),
  simulateTransaction: async () => ({ success: true }),
  executeTransaction: async () => ({
    transactionHash: "0xabc123def456",
    blockNumber: BigInt(55644360),
    blockHash: "0xhash",
    status: true,
    gasUsed: BigInt(21000),
    cumulativeGasUsed: BigInt(21000),
    logs: [],
  }),
};

async function main(): Promise<void> {
  logger.info("Testing X402PaymentHandler...");

  try {
    const paymentHandler = new X402PaymentHandler(mockWalletAgent as any);
    logger.info("X402PaymentHandler instantiated");

    logger.info("Mocking HTTP 402 response", {
      url: mockHttp402Response.url,
      amount: mockHttp402Response.amount.toString(),
    });

    const result = await paymentHandler.handlePayment(mockHttp402Response);
    logger.info("Payment result", {
      txHash: result.txHash,
      success: result.success,
    });

    const history = await paymentHandler.getPaymentHistory();
    logger.info("Payment history length", { count: history.length });

    if (history.length > 0) {
      logger.info("Payment record verified in history", {
        url: history[0]?.url,
        amount: history[0]?.amount.toString(),
      });
    }

    logger.info("X402PaymentHandler test completed successfully!");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("X402PaymentHandler test failed", { error: message });
    throw error;
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
