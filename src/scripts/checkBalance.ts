import { createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import * as dotenv from "dotenv";

dotenv.config();

const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);

const client = createPublicClient({
  chain: {
    id: 196,
    name: "X Layer",
    nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
    rpcUrls: { default: { http: ["https://rpc.xlayer.tech"] } },
  },
  transport: http("https://rpc.xlayer.tech"),
});

console.log("=== BALANCE CHECK ===");
console.log("Wallet address:", account.address);

const walletBalance = await client.getBalance({ address: account.address });
console.log("Wallet balance:", walletBalance.toString(), "wei");
console.log("Wallet balance:", Number(walletBalance) / 1e18, "OKB");

console.log("\nVault address:", process.env.VAULT_ADDRESS);
const vaultBalance = await client.getBalance({ address: process.env.VAULT_ADDRESS as `0x${string}` });
console.log("Vault balance:", vaultBalance.toString(), "wei");
console.log("Vault balance:", Number(vaultBalance) / 1e18, "OKB");
