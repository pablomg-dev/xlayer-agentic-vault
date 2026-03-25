import type { IWalletAgent } from "../core/interfaces/IWalletAgent.js";
import type { IVault } from "../core/interfaces/IVault.js";
import type { IPaymentHandler } from "../core/interfaces/IPaymentHandler.js";
import type { IOrchestrator, AgentStatus, CycleResult } from "../core/interfaces/IOrchestrator.js";
import { logger } from "../utils/logger.js";

export type VaultHealthStatus = "healthy" | "low" | "critical";

const DEFAULT_LOW_THRESHOLD = BigInt(1000000000000000000);
const DEFAULT_CRITICAL_THRESHOLD = BigInt(100000000000000000);

export class AgentOrchestrator implements IOrchestrator {
  private status: AgentStatus = "idle";
  private readonly walletAgent: IWalletAgent;
  private readonly vault: IVault;
  private readonly paymentHandler: IPaymentHandler;
  private readonly lowThreshold: bigint;
  private readonly criticalThreshold: bigint;

  constructor(
    walletAgent: IWalletAgent,
    vault: IVault,
    paymentHandler: IPaymentHandler
  ) {
    this.walletAgent = walletAgent;
    this.vault = vault;
    this.paymentHandler = paymentHandler;
    this.lowThreshold = this.parseThreshold("VAULT_THRESHOLD_LOW", DEFAULT_LOW_THRESHOLD);
    this.criticalThreshold = this.parseThreshold("VAULT_THRESHOLD_CRITICAL", DEFAULT_CRITICAL_THRESHOLD);
  }

  async start(): Promise<void> {
    logger.info("Starting Agent Orchestrator...");
    this.status = "running";
    logger.info("Agent Orchestrator started", { status: this.status });
  }

  async stop(): Promise<void> {
    logger.info("Stopping Agent Orchestrator...");
    this.status = "stopped";
    logger.info("Agent Orchestrator stopped");
  }

  getStatus(): AgentStatus {
    return this.status;
  }

  async runCycle(): Promise<CycleResult> {
    const timestamp = Date.now();
    logger.info("=== Starting autonomous cycle ===", { timestamp });

    try {
      const balance = await this.vault.getVaultBalance(
        "0x0000000000000000000000000000000000000000"
      );

      logger.info("Vault balance checked", { balance: balance.toString() });

      const healthStatus = this.evaluateVaultHealth(balance);

      if (healthStatus === "healthy") {
        logger.info("Vault healthy, no action needed", {
          balance: balance.toString(),
          threshold: this.lowThreshold.toString(),
        });

        return {
          success: true,
          action: "vault_healthy",
          timestamp,
          details: `Balance ${balance} exceeds threshold ${this.lowThreshold}`,
        };
      }

      if (healthStatus === "low") {
        logger.warn("Vault low balance detected", {
          balance: balance.toString(),
          threshold: this.lowThreshold.toString(),
        });

        return {
          success: true,
          action: "low_balance_alert",
          timestamp,
          details: `Balance below ${this.lowThreshold}, consider depositing`,
        };
      }

      logger.error("Vault critical balance!", {
        balance: balance.toString(),
        threshold: this.criticalThreshold.toString(),
      });

      return {
        success: false,
        action: "critical_balance",
        timestamp,
        details: `Critical: balance ${balance} below critical threshold ${this.criticalThreshold}`,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("Cycle failed", { error: message });

      return {
        success: false,
        action: "error",
        timestamp,
        details: message,
      };
    }
  }

  private evaluateVaultHealth(balance: bigint): VaultHealthStatus {
    if (balance >= this.lowThreshold) {
      return "healthy";
    }
    if (balance >= this.criticalThreshold) {
      return "low";
    }
    return "critical";
  }

  private parseThreshold(envVar: string, defaultValue: bigint): bigint {
    const value = process.env[envVar];
    if (!value) {
      return defaultValue;
    }
    try {
      return BigInt(value);
    } catch {
      logger.warn(`Invalid ${envVar}, using default`);
      return defaultValue;
    }
  }
}
