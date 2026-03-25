export type AgentStatus = "idle" | "running" | "stopped" | "error";

export interface CycleResult {
  success: boolean;
  action: string;
  txHash?: string;
  timestamp: number;
  details?: string;
}

export interface IOrchestrator {
  start(): Promise<void>;
  stop(): Promise<void>;
  getStatus(): AgentStatus;
  runCycle(): Promise<CycleResult>;
}
