export class PaymentFailedError extends Error {
  public readonly name = "PaymentFailedError";
  public readonly url: string;
  public readonly reason: string;

  constructor(url: string, reason: string) {
    super(`Payment to ${url} failed: ${reason}`);
    this.url = url;
    this.reason = reason;
  }
}

export class PaymentVerificationError extends Error {
  public readonly name = "PaymentVerificationError";
  public readonly txHash: string;

  constructor(txHash: string) {
    super(`Payment verification failed for tx: ${txHash}`);
    this.txHash = txHash;
  }
}

export class InvalidPaymentRequestError extends Error {
  public readonly name = "InvalidPaymentRequestError";
  public readonly details: string;

  constructor(details: string) {
    super(`Invalid payment request: ${details}`);
    this.details = details;
  }
}
