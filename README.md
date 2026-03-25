# xlayer-agentic-vault

Autonomous agent for asset management on X Layer (OKX L2, chainId: 196).

## Overview

An agentic wallet system for X Layer that provides:
- Vault management (deposit/withdraw) with configurable limits
- x402 payment protocol integration for autonomous micropayments
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
│   └── interfaces/            # Core interfaces
│       ├── IPaymentHandler.ts
│       ├── IVault.ts
│       └── IWalletAgent.ts
├── payments/
│   └── X402PaymentHandler.ts # x402 payment protocol
├── scripts/                   # Integration scripts
│   ├── testConnection.ts
│   ├── testPayment.ts
│   └── testVault.ts
├── utils/
│   └── logger.ts             # Singleton logger
└── vault/
    └── VaultService.ts      # Vault management
tests/
├── agent.test.ts
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
RPC_URL=https://rpc.xlayer.tech
PRIVATE_KEY=0x...          # Your wallet private key
VAULT_ADDRESS=0x...       # Vault contract address
MAX_DEPOSIT_AMOUNT=        # Max deposit in wei
MIN_DEPOSIT_AMOUNT=        # Min deposit in wei
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm test` | Run all unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:connection` | Test X Layer RPC connection |
| `npm run test:vault` | Test vault service (read-only) |
| `npm run test:payment` | Test x402 payment handler |

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npx vitest run tests/agent.test.ts
```

## Integration Tests

```bash
# Test X Layer connection
npm run test:connection

# Test vault balance (read-only)
npm run test:vault

# Test payment handler flow
npm run test:payment
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

## Development

```bash
# Type check
npx tsc --noEmit

# Run with debug logging
DEBUG=true npm run test:connection
```

## License

MIT
