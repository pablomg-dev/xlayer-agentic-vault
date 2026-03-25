/**
 * Tipos para solicitud de transacción.
 * Corresponde al estándar EVM TransactionRequest.
 */
export interface TransactionRequest {
  to: string;
  from?: string;
  value?: bigint;
  data?: string;
  gasLimit?: bigint;
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  nonce?: number;
  chainId?: number;
}

/**
 * Resultado de simulación de transacción.
 * Indica si la transacción sería exitosa sin ejecutarla.
 */
export interface SimulationResult {
  success: boolean;
  gasUsed?: bigint;
  revertReason?: string;
  logs?: Array<{
    address: string;
    data: string;
    topics: string[];
  }>;
}

/**
 * Receipt de transacción ejecutada.
 * Contiene el resultado de una transacción minada.
 */
export interface TransactionReceipt {
  transactionHash: string;
  blockNumber: bigint;
  blockHash: string;
  status: boolean;
  gasUsed: bigint;
  cumulativeGasUsed: bigint;
  logs: Array<{
    address: string;
    data: string;
    topics: string[];
    logIndex: bigint;
  }>;
}

/**
 * Interfaz abstracta para agente de wallet.
 * Define el contrato que toda implementación de wallet debe seguir.
 * Facilita el testing mediante inyección de dependencias y mocking.
 */
export interface IWalletAgent {
  /**
   * Inicializa la conexión con la wallet.
   * @throws WalletConnectionError si falla la conexión
   */
  connect(): Promise<void>;

  /**
   * Obtiene el balance de un token específico.
   * @param tokenAddress Dirección del token (address(0) para nativo)
   * @return Balance en wei (bigint)
   */
  getBalance(tokenAddress: string): Promise<bigint>;

  /**
   * Simula una transacción sin ejecutarla.
   * Útil para verificar si una transacción sería exitosa antes de ejecutarla.
   * @param tx Solicitud de transacción
   * @return Resultado de la simulación
   * @throws TransactionSimulationError si la simulación falla
   */
  simulateTransaction(tx: TransactionRequest): Promise<SimulationResult>;

  /**
   * Ejecuta una transacción en la blockchain.
   * @param tx Solicitud de transacción
   * @return Receipt de la transacción
   * @throws TransactionSimulationError si la simulación falla
   */
  executeTransaction(tx: TransactionRequest): Promise<TransactionReceipt>;
}
