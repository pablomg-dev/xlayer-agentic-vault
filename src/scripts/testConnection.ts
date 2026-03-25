import { createPublicClient, http } from "viem";
import { xLayer } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import * as dotenv from "dotenv";
import { XLAYER_CONFIG } from "../config/network.js";
import { logger } from "../utils/logger.js";

dotenv.config();

async function main(): Promise<void> {
  logger.info("Testing X Layer connection...", { rpcUrl: XLAYER_CONFIG.rpcUrl });

  try {
    const client = createPublicClient({
      chain: {
        ...xLayer,
        rpcUrls: {
          default: {
            http: [XLAYER_CONFIG.rpcUrl],
          },
        },
      },
      transport: http(XLAYER_CONFIG.rpcUrl),
    });

    logger.info("Fetching latest block...");
    const block = await client.getBlock();
    logger.info("Latest block retrieved", {
      number: block.number.toString(),
      hash: block.hash,
      timestamp: Number(block.timestamp),
    });

    logger.info("Fetching chain ID...");
    const chainId = await client.getChainId();
    logger.info("Chain ID retrieved", { chainId });

    if (chainId !== XLAYER_CONFIG.chainId) {
      logger.error("Chain ID mismatch!", {
        expected: XLAYER_CONFIG.chainId,
        actual: chainId,
      });
      throw new Error(
        `Chain ID mismatch: expected ${XLAYER_CONFIG.chainId}, got ${chainId}`
      );
    }

    logger.info("Chain ID verified successfully", { chainId: XLAYER_CONFIG.chainId });

    if (process.env.PRIVATE_KEY) {
      const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
      const address = account.address;

      logger.info("Fetching wallet balance...", { address });
      const balance = await client.getBalance({ address });
      logger.info("Wallet balance retrieved", {
        address,
        balance: balance.toString(),
        wei: balance.toString(),
      });
    } else {
      logger.warn("PRIVATE_KEY not found in .env, skipping balance check");
    }

    logger.info("Connection test completed successfully!");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("Connection test failed", { error: message });
    throw error;
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
