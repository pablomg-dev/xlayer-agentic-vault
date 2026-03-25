# Plan: Capa de Abstracción Base - xlayer-agentic-vault

## 1. Dependencias a agregar en package.json

- `@okxweb3/coin-ethereum` (SDK OKX)
- `vitest` (test runner)
- `dotenv` (variables de entorno)
- `@types/node` (tipos)

## 2. Estructura de directorios

```
src/
├── core/
│   ├── interfaces/
│   │   └── IWalletAgent.ts
│   └── errors/
│       └── WalletErrors.ts
├── agents/
│   └── OKXAgenticWallet.ts
└── utils/
    └── logger.ts
tests/
└── agent.test.ts
```

## 3. Archivos a crear

| # | Archivo | Contenido |
|---|---------|-----------|
| 1 | `src/core/interfaces/IWalletAgent.ts` | Interfaz IWalletAgent + tipos TransactionRequest, SimulationResult, TransactionReceipt |
| 2 | `src/core/errors/WalletErrors.ts` | InsufficientFundsError, TransactionSimulationError, WalletConnectionError |
| 3 | `src/agents/OKXAgenticWallet.ts` | Implementación IWalletAgent con validateSufficientBalance() privado |
| 4 | `src/utils/logger.ts` | Logger singleton con niveles info/warn/error/debug, contexto opcional |
| 5 | `tests/agent.test.ts` | 3 tests con vi.mock() del SDK OKX |

## 4. Decisiones técnicas

- **Config vitest**: ¿en package.json o vitest.config.ts?
- **SDK**: ¿Ya está instalado @okxweb3/coin-ethereum?

## 5. Detalles de implementación

### IWalletAgent.ts
- Métodos: connect(), getBalance(tokenAddress), simulateTransaction(tx), executeTransaction(tx)
- Tipos: TransactionRequest, SimulationResult, TransactionReceipt

### WalletErrors.ts
- InsufficientFundsError: campos required y available (bigint)
- TransactionSimulationError: campo transaction
- WalletConnectionError: campo reason

### OKXAgenticWallet.ts
- Constructor recibe privateKey y rpcUrl desde process.env
- Valida presencia de env vars al inicio
- Método privado validateSufficientBalance()
- simulateTransaction y executeTransaction llaman a validateSufficientBalance antes de operar

### logger.ts
- Niveles: info, warn, error, debug
- Cada log incluye: timestamp ISO, nivel, mensaje, context opcional
- Diseño para swap futuro con winston/pino

### agent.test.ts
1. Test: lanza InsufficientFundsError cuando balance es insuficiente
2. Test: executeTransaction no se llama si simulateTransaction falla
3. Test: connect() lanza WalletConnectionError si faltan env vars
