require("dotenv").config();
const { createPublicClient, createWalletClient, http } = require("viem");
const { privateKeyToAccount } = require("viem/accounts");

const VAULT_ADDRESS = process.env.VAULT_ADDRESS;
const RPC_URL = process.env.RPC_URL || "https://rpc.xlayer.tech";
const DEPOSIT_AMOUNT = BigInt("1000000000000000"); // 0.001 OKB

const VAULT_ABI = [
  { name: "deposit", type: "function", inputs: [], outputs: [], stateMutability: "payable" },
  { name: "withdraw", type: "function", inputs: [{ name: "amount", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { name: "getBalance", type: "function", inputs: [], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
];

async function main() {
  console.log("=== Vault Deposit Test ===");
  
  const account = privateKeyToAccount(process.env.PRIVATE_KEY);
  const walletAddress = account.address;
  
  const publicClient = createPublicClient({
    chain: { id: 196, name: "X Layer", nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 }, rpcUrls: { default: { http: [RPC_URL] } } },
    transport: http(RPC_URL),
  });
  
  const walletClient = createWalletClient({
    account,
    chain: { id: 196, name: "X Layer", nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 }, rpcUrls: { default: { http: [RPC_URL] } } },
    transport: http(RPC_URL),
  });

  console.log("Wallet:", walletAddress);
  console.log("Vault:", VAULT_ADDRESS);
  
  const balanceBefore = await publicClient.readContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "getBalance",
  });
  console.log("Vault balance BEFORE:", balanceBefore.toString(), "wei");

  const walletBalance = await publicClient.getBalance({ address: walletAddress });
  console.log("Wallet balance:", walletBalance.toString(), "wei");

  console.log("\nDepositing", DEPOSIT_AMOUNT.toString(), "wei...");
  
  const hash = await walletClient.writeContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "deposit",
    value: DEPOSIT_AMOUNT,
  });
  
  console.log("Deposit tx:", hash);
  
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log("Deposit confirmed! Block:", receipt.blockNumber.toString());
  console.log("Gas used:", receipt.gasUsed.toString());

  const balanceAfter = await publicClient.readContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "getBalance",
  });
  console.log("\nVault balance AFTER:", balanceAfter.toString(), "wei");
  console.log("Increase:", (balanceAfter - balanceBefore).toString(), "wei");
}

main().catch(console.error);
