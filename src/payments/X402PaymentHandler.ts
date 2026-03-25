import type { IWalletAgent } from "../core/interfaces/IWalletAgent.js";
import type {
  IPaymentHandler,
  Http402Response,
  PaymentResult,
  PaymentRecord,
} from "../core/interfaces/IPaymentHandler.js";
import {
  PaymentFailedError,
  InvalidPaymentRequestError,
} from "../core/errors/PaymentErrors.js";
import { logger } from "../utils/logger.js";

export class X402PaymentHandler implements IPaymentHandler {
  private readonly walletAgent: IWalletAgent;
  private readonly paymentHistory: PaymentRecord[] = [];

  constructor(walletAgent: IWalletAgent) {
    this.walletAgent = walletAgent;
    logger.info("X402PaymentHandler initialized");
  }

  async handlePayment(response: Http402Response): Promise<PaymentResult> {
    this.validatePaymentRequest(response);

    logger.info("Processing x402 payment", {
      url: response.url,
      amount: response.amount,
      recipient: response.recipient,
    });

    try {
      const tx = this.buildPaymentTx(response);
      const receipt = await this.walletAgent.executeTransaction(tx);

      const result: PaymentResult = {
        txHash: receipt.transactionHash,
        success: receipt.status,
        timestamp: Date.now(),
      };

      const record = this.buildPaymentRecord(result, response);
      this.paymentHistory.push(record);

      logger.info("Payment processed successfully", {
        txHash: result.txHash,
        url: response.url,
      });

      return result;
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      logger.error("Payment failed", { url: response.url, reason });
      throw new PaymentFailedError(response.url, reason);
    }
  }

  async verifyPayment(txHash: string): Promise<boolean> {
    logger.debug("Verifying payment", { txHash });

    const record = this.paymentHistory.find((p) => p.txHash === txHash);
    if (!record) {
      logger.warn("Payment not found in history", { txHash });
      return false;
    }

    return record.success;
  }

  async getPaymentHistory(): Promise<PaymentRecord[]> {
    return [...this.paymentHistory];
  }

  private validatePaymentRequest(response: Http402Response): void {
    if (!response.url || response.url.length === 0) {
      throw new InvalidPaymentRequestError("url is required");
    }
    if (response.amount <= 0n) {
      throw new InvalidPaymentRequestError("amount must be greater than 0");
    }
    if (!response.recipient || response.recipient.length === 0) {
      throw new InvalidPaymentRequestError("recipient is required");
    }
    if (!response.tokenAddress || response.tokenAddress.length === 0) {
      throw new InvalidPaymentRequestError("tokenAddress is required");
    }
  }

  private buildPaymentTx(response: Http402Response) {
    return {
      to: response.recipient,
      value: response.amount,
      data: response.memo ? this.encodeMemo(response.memo) : "0x",
    };
  }

  private encodeMemo(memo: string): string {
    const methodId = "0x";
    const paddedLength = Math.ceil(memo.length / 2) * 2;
    const hexMemo = Buffer.from(memo.slice(0, 32)).toString("hex").padStart(paddedLength, "0");
    return `${methodId}${hexMemo}`;
  }

  private buildPaymentRecord(
    result: PaymentResult,
    response: Http402Response
  ): PaymentRecord {
    return {
      txHash: result.txHash,
      success: result.success,
      timestamp: result.timestamp,
      url: response.url,
      amount: response.amount,
      tokenAddress: response.tokenAddress,
    };
  }
}
