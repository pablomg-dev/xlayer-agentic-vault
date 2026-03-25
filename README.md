# xlayer-agentic-vault

> Autonomous agent for asset management and x402 payments on X Layer (OKX L2, chainId: 196)

Built for the **X Layer Onchain OS AI Hackathon** — an agentic vault system that autonomously monitors balances, manages deposits/withdrawals, and executes x402 micropayments on X Layer mainnet.

## 🤖 AI-Assisted Development

This project was built with the assistance of:
- **[Claude](https://claude.ai)** (Anthropic) — architecture design, prompt engineering, code review
- **[MiniMax M2.5](https://www.minimaxi.com)** (free tier via OpenCode) — code generation and implementation

## Overview

- **Smart Contract Vault** deployed on X Layer mainnet
- Autonomous decision cycles (healthy / low / critical balance)
- x402 payment protocol for autonomous micropayments
- Full TypeScript with strong typing — `any` is forbidden
- SOLID principles throughout
- 20/20 unit tests passing

## Tech Stack

- **Runtime**: Node.js 20 + TypeScript 6
- **Blockchain**: viem for X Layer RPC
- **Smart Contracts**: Solidity 0.8.0 + Hardhat
- **Testing**: Vitest
- **Environment**: dotenv

## Project Structure

```
src/
├── agents/
│   └── OKXAgenticWallet.ts       # OKX Agentic Wallet with viem
├── config/
│   └── network.ts                # X Layer network config (chainId 196)
├── contracts/
│   └── Vault.sol                 # Smart contract
├── core/
│   ├── errors/                   # Typed custom errors
│   │   ├── PaymentErrors.ts
│   │   ├── VaultErrors.ts
│   │   └── WalletErrors.ts
│   └── interfaces/               # Core interfaces (SOLID ISP)
│       ├── IPaymentHandler.ts
│       ├── IOrchestrator.ts
│       ├── IVault.ts
│       └── IWalletAgent.ts
├── orchestrator/
│   └── AgentOrchestrator.ts      # Autonomous decision cycles
├── payments/
│   └── X402PaymentHandler.ts     # x402 payment protocol
├── scripts/
│   ├── runAgent.ts               # Main demo entry point
│   ├── testConnection.ts         # Verify X Layer RPC
│   ├── testPayment.ts            # Test payment flow
│   ├── testVault.ts              # Read-only vault test
│   ├── testDeposit.cjs           # Deposit to vault contract
│   ├── testWithdraw.cjs          # Withdraw from vault contract
│   └── deploy.cjs                # Deploy vault contract
├── utils/
│   └── logger.ts                 # Typed singleton logger
└── vault/
    └── VaultService.ts           # Vault contract interaction
tests/
├── agent.test.ts
├── orchestrator.test.ts
├── payment.test.ts
└── vault.test.ts
```

## Smart Contract — X Layer Mainnet

**Vault Contract**: `0x7FE71a4817Fe49658BCFFBCcD7FBc00B5f74F150`

| Function | Description |
|----------|-------------|
| `deposit()` | Payable — receive native OKB |
| `withdraw(uint256 amount)` | Owner only |
| `getBalance()` | Returns contract balance |

**Events**: `Deposited(address, amount)` · `Withdrawn(address, amount)`

## Live Transactions on X Layer Mainnet

| Operation | Tx Hash | Gas Used |
|-----------|---------|----------|
| Deposit 0.001 OKB | `0x0c0d5569...` | 45,165 |
| Withdraw 0.001 OKB | `0x5486973f...` | 33,146 |

## Installation

```bash
npm install
```

## Configuration

```bash
cp .env.example .env
```

```dotenv
RPC_URL=https://rpc.xlayer.tech
PRIVATE_KEY=0x...

VAULT_ADDRESS=0x7FE71a4817Fe49658BCFFBCcD7FBc00B5f74F150

MAX_DEPOSIT_AMOUNT=1000000000000000000    # 1 OKB
MIN_DEPOSIT_AMOUNT=1000000000000000       # 0.001 OKB

VAULT_THRESHOLD_LOW=50000000000000000     # 0.05 OKB
VAULT_THRESHOLD_CRITICAL=10000000000000000 # 0.01 OKB
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm test` | Run all 20 unit tests |
| `npm run test:watch` | Watch mode |
| `npm run test:connection` | Verify X Layer RPC + chainId |
| `npm run test:vault` | Read-only vault test |
| `npm run test:payment` | x402 payment flow test |
| `npm run run:agent` | Run autonomous agent demo |
| `npm run run:agent:ts-node` | Run with ts-node/esm |

## Running the Agent

```bash
npm run run:agent:ts-node
```

Example output:
```
==================================================
  X Layer Agentic Vault - Demo
==================================================
[INFO] Connecting to wallet...
[INFO] Wallet connected successfully
[INFO] VaultService initialized

--- Cycle 1 ---
  Action:    vault_healthy
  Success:   true
  Details:   Balance above threshold

--- Cycle 2 ---
  Action:    vault_healthy
  Success:   true

--- Cycle 3 ---
  Action:    vault_healthy
  Success:   true
==================================================
  Demo Complete
==================================================
```

## Deploy New Vault Contract

```bash
npx hardhat compile
npx hardhat run scripts/deploy.cjs --network xlayer
```

## Core Interfaces

### IWalletAgent
- `connect()` — initialize wallet connection
- `getBalance(tokenAddress)` — balance in wei
- `simulateTransaction(tx)` — dry-run before execution
- `executeTransaction(tx)` — submit to X Layer

### IVault
- `deposit(tokenAddress, amount)` — deposit into vault contract
- `withdraw(tokenAddress, amount, recipient)` — withdraw from vault
- `getVaultBalance(tokenAddress)` — current contract balance
- `getDepositHistory(tokenAddress)` — operation history

### IPaymentHandler
- `handlePayment(response)` — handle HTTP 402 payment request
- `verifyPayment(txHash)` — confirm payment on-chain
- `getPaymentHistory()` — payment history

### IOrchestrator
- `start()` — initialize all modules
- `stop()` — graceful shutdown
- `getStatus()` — `idle` | `running` | `stopped` | `error`
- `runCycle()` — one autonomous decision cycle

## Agent Decision Logic

Each cycle evaluates vault health and acts accordingly:

| Status | Condition | Action |
|--------|-----------|--------|
| `healthy` | balance > `VAULT_THRESHOLD_LOW` | Log, no action |
| `low` | balance between thresholds | Simulate deposit |
| `critical` | balance < `VAULT_THRESHOLD_CRITICAL` | Alert + simulate deposit |

## X Layer Network

| Property | Value |
|----------|-------|
| Chain ID | 196 |
| RPC | https://rpc.xlayer.tech |
| Explorer | https://www.oklink.com/xlayer |
| Currency | OKB (18 decimals) |

## License

MIT
