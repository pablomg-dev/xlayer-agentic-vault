# xlayer-agentic-vault

Autonomous agent for asset management on X Layer (OKX L2, chainId: 196).

## Overview

An agentic wallet system for X Layer that provides:
- Vault management (deposit/withdraw) with configurable limits
- x402 payment protocol integration for autonomous micropayments
- Agent orchestrator for autonomous decision cycles
- Real-time X Layer RPC connectivity
- Comprehensive error handling and logging

## Tech Stack

- **Runtime**: Node.js 20 + TypeScript 6
- **SDK**: @okxweb3/coin-ethereum
- **Blockchain**: viem for X Layer RPC
- **Testing**: Vitest
- **Environment**: dotenv

## Project Structure

```
src/
├── agents/                    # Wallet implementations
│   └── OKXAgenticWallet.ts   # OKX Agentic Wallet integration
├── config/
│   └── network.ts            # X Layer network configuration
├── core/
│   ├── errors/               # Custom error classes
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
├── scripts/                  # Integration scripts
│   ├── runAgent.ts          # Main demo entry point
│   ├── testConnection.ts
│   ├── testPayment.ts
│   └── testVault.ts
├── utils/
│   └── logger.ts            # Singleton logger
└── vault/
    └── VaultService.ts      # Vault management
tests/
├── agent.test.ts
├── orchestrator.test.ts
├── payment.test.ts
└── vault.test.ts
```

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

# Vault Configuration
VAULT_ADDRESS=0x...        # Vault contract address
MAX_DEPOSIT_AMOUNT=        # Max deposit in wei (default: 1 OKB)
MIN_DEPOSIT_AMOUNT=        # Min deposit in wei (default: 0.001 OKB)

# Orchestrator Thresholds
VAULT_THRESHOLD_LOW=       # Low balance threshold (default: 0.5 OKB)
VAULT_THRESHOLD_CRITICAL= # Critical balance threshold (default: 0.1 OKB)
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm test` | Run all unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:connection` | Test X Layer RPC connection |
| `npm run test:vault` | Test vault service (read-only) |
| `npm run test:payment` | Test x402 payment handler |
| `npm run run:agent` | Run agent demo (with tsx) |
| `npm run run:agent:ts-node` | Run agent with ts-node |

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

# Run agent with ts-node
npm run run:agent:ts-node
```

## Core Interfaces

### IWalletAgent
- `connect()` - Initialize wallet connection
- `getBalance(tokenAddress)` - Get token balance in wei
- `simulateTransaction(tx)` - Simulate transaction before execution
- `executeTransaction(tx)` - Execute transaction on X Layer

### IVault
- `deposit(tokenAddress, amount)` - Deposit tokens into vault
- `withdraw(tokenAddress, amount, recipient)` - Withdraw tokens
- `getVaultBalance(tokenAddress)` - Get vault balance
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
1. Check vault balance
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

## Error Handling

All errors are typed and extend `Error`:
- `WalletErrors`: Connection, simulation, funds errors
- `VaultErrors`: Deposit limits, withdrawal errors
- `PaymentErrors`: Payment failures, verification errors
- `InsufficientFundsError`, `DepositLimitExceededError`, etc.

## Development

```bash
# Type check
npx tsc --noEmit

# Run agent demo with real wallet
npm run run:agent

# Run agent with mock wallet (no PRIVATE_KEY required)
# Just leave PRIVATE_KEY empty in .env
npm run run:agent
```

## License

MIT
