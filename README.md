# xlayer-agentic-vault

Autonomous agent for asset management on X Layer (OKX L2, chainId: 196).

## Overview

An agentic wallet system for X Layer that provides:
- **Smart Contract Vault**: Real Vault contract deployed on X Layer mainnet
- Vault management (deposit/withdraw) with configurable limits
- x402 payment protocol integration for autonomous micropayments
- Agent orchestrator for autonomous decision cycles
- Real-time X Layer RPC connectivity
- Comprehensive error handling and logging

## Tech Stack

- **Runtime**: Node.js 20 + TypeScript 6
- **Blockchain SDK**: viem for X Layer RPC
- **Smart Contracts**: Solidity 0.8.0 + Hardhat
- **Testing**: Vitest
- **Environment**: dotenv

## Project Structure

```
src/
├── agents/                    # Wallet implementations
│   └── OKXAgenticWallet.ts  # OKX Agentic Wallet with viem
├── config/
│   └── network.ts           # X Layer network configuration
├── contracts/
│   └── Vault.sol            # Smart contract (for reference)
├── core/
│   ├── errors/              # Custom error classes
│   │   ├── PaymentErrors.ts
│   │   ├── VaultErrors.ts
│   │   └── WalletErrors.ts
│   └── interfaces/          # Core interfaces
│       ├── IPaymentHandler.ts
│       ├── IOrchestrator.ts
│       ├── IVault.ts
│       └── IWalletAgent.ts
├── orchestrator/
│   └── AgentOrchestrator.ts  # Autonomous agent cycles
├── payments/
│   └── X402PaymentHandler.ts # x402 payment protocol
├── scripts/                  # Integration & deployment scripts
│   ├── runAgent.ts          # Main demo entry point
│   ├── testConnection.ts
│   ├── testPayment.ts
│   ├── testVault.ts
│   ├── testDeposit.cjs      # Deposit to vault contract
│   ├── testWithdraw.cjs     # Withdraw from vault contract
│   └── deploy.cjs           # Deploy vault contract
├── utils/
│   └── logger.ts            # Singleton logger
└── vault/
    └── VaultService.ts      # Vault contract interaction
tests/
├── agent.test.ts
├── orchestrator.test.ts
├── payment.test.ts
└── vault.test.ts
```

## Smart Contract (X Layer Mainnet)

### Vault Contract

Deployed at: `0x7FE71a4817Fe49658BCFFBCcD7FBc00B5f74F150`

**Features:**
- `deposit()` - Payable function to receive native OKB
- `withdraw(uint256 amount)` - Only owner can withdraw
- `getBalance()` - Returns contract balance
- `owner` - Contract owner address

**Events:**
- `Deposited(address indexed from, uint256 amount)`
- `Withdrawn(address indexed to, uint256 amount)`

## Installation

```bash
npm install
```

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
# X Layer RPC
RPC_URL=https://rpc.xlayer.tech

# Wallet (required for real transactions)
PRIVATE_KEY=0x...          # Your wallet private key

# Vault Contract
VAULT_ADDRESS=0x7FE71a4817Fe49658BCFFBCcD7FBc00B5f74F150

# Vault Limits
MAX_DEPOSIT_AMOUNT=1000000000000000000    # 1 OKB
MIN_DEPOSIT_AMOUNT=1000000000000000       # 0.001 OKB

# Orchestrator Thresholds
VAULT_THRESHOLD_LOW=50000000000000000      # 0.05 OKB
VAULT_THRESHOLD_CRITICAL=10000000000000000 # 0.01 OKB
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm test` | Run all unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:connection` | Test X Layer RPC connection |
| `npm run test:vault` | Test vault service (read-only) |
| `npm run test:payment` | Test x402 payment handler |
| `npm run run:agent` | Run agent demo |
| `npm run run:agent:ts-node` | Run agent with ts-node |
| `npx hardhat run scripts/deploy.cjs --network xlayer` | Deploy Vault contract |

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npx vitest run tests/agent.test.ts

# Run orchestrator tests
npx vitest run tests/orchestrator.test.ts
```

## Integration Tests

```bash
# Test X Layer connection
npm run test:connection

# Test vault balance (read-only)
npm run test:vault

# Test payment handler flow
npm run test:payment

# Run full agent demo
npm run run:agent
```

## Deploy New Vault Contract

```bash
# Compile contracts
npx hardhat compile

# Deploy to X Layer
npx hardhat run scripts/deploy.cjs --network xlayer
```

## Core Interfaces

### IWalletAgent
- `connect()` - Initialize wallet connection
- `getBalance(tokenAddress)` - Get token balance in wei
- `simulateTransaction(tx)` - Simulate transaction before execution
- `executeTransaction(tx)` - Execute transaction on X Layer

### IVault
- `deposit(tokenAddress, amount)` - Deposit tokens into vault contract
- `withdraw(tokenAddress, amount, recipient)` - Withdraw tokens from vault
- `getVaultBalance(tokenAddress)` - Get vault contract balance
- `getDepositHistory(tokenAddress)` - Get operation history

### IPaymentHandler
- `handlePayment(response)` - Handle HTTP 402 payment request
- `verifyPayment(txHash)` - Verify payment was successful
- `getPaymentHistory()` - Get payment history

### IOrchestrator
- `start()` - Initialize all modules
- `stop()` - Graceful shutdown
- `getStatus()` - Get agent status (idle/running/stopped/error)
- `runCycle()` - Execute one autonomous decision cycle

## Agent Orchestrator

The orchestrator runs autonomous decision cycles that:
1. Check vault contract balance
2. Evaluate health status (healthy/low/critical)
3. Take appropriate action based on thresholds
4. Log all decisions with timestamps

### Vault Health Status
- **healthy**: Balance above VAULT_THRESHOLD_LOW
- **low**: Balance between VAULT_THRESHOLD_LOW and VAULT_THRESHOLD_CRITICAL
- **critical**: Balance below VAULT_THRESHOLD_CRITICAL

## X Layer Configuration

- **Chain ID**: 196
- **RPC**: https://rpc.xlayer.tech
- **Explorer**: https://www.oklink.com/xlayer
- **Native Currency**: OKB (18 decimals)

## Live Demo Results

### Transactions on X Layer Mainnet

| Operation | Tx Hash | Gas Used |
|-----------|---------|----------|
| Vault Deploy | - | - |
| Deposit 0.001 OKB | 0x0c0d5569... | 45,165 |
| Withdraw 0.001 OKB | 0x5486973f... | 33,146 |

### Agent Demo Output

```
--- Cycle 1 ---
  Action:    critical_balance
  Success:   false
  Details:   Critical: balance 1000000000000000 below threshold 10000000000000000
```

## Error Handling

All errors are typed and extend `Error`:
- `WalletErrors`: Connection, simulation, funds errors
- `VaultErrors`: Deposit limits, withdrawal errors
- `PaymentErrors`: Payment failures, verification errors
- `InsufficientFundsError`, `DepositLimitExceededError`, etc.

## License

MIT
