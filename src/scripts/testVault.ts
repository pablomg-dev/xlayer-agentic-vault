import * as dotenv from "dotenv";
import { OKXAgenticWallet } from "../agents/OKXAgenticWallet.js";
import { VaultService } from "../vault/VaultService.js";
import { XLAYER_CONFIG } from "../config/network.js";
import { logger } from "../utils/logger.js";

dotenv.config();

const NATIVE_TOKEN = "0x0000000000000000000000000000000000000000";

async function main(): Promise<void> {
  logger.info("Testing VaultService against X Layer...");

  try {
    const wallet = new OKXAgenticWallet();
    await wallet.connect();
    logger.info("Wallet connected");

    const vaultConfig = {
      vaultAddress: process.env.VAULT_ADDRESS ?? XLAYER_CONFIG.rpcUrl,
      maxDepositAmount: BigInt(process.env.MAX_DEPOSIT_AMOUNT ?? "1000000000000000000"),
      minDepositAmount: BigInt(process.env.MIN_DEPOSIT_AMOUNT ?? "1000000000000000"),
    };

    const vault = new VaultService(wallet, vaultConfig);
    logger.info("VaultService initialized", { config: vaultConfig });

    logger.info("Fetching vault balance for native token...");
    const balance = await vault.getVaultBalance(NATIVE_TOKEN);
    logger.info("Vault balance retrieved", {
      tokenAddress: NATIVE_TOKEN,
      balance: balance.toString(),
      wei: balance.toString(),
    });

    logger.info("Vault test completed successfully!");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("Vault test failed", { error: message });
    throw error;
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
