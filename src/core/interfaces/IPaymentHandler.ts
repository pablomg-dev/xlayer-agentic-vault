export interface Http402Response {
  url: string;
  amount: bigint;
  tokenAddress: string;
  recipient: string;
  memo?: string;
}

export interface PaymentResult {
  txHash: string;
  success: boolean;
  timestamp: number;
}

export interface PaymentRecord extends PaymentResult {
  url: string;
  amount: bigint;
  tokenAddress: string;
}

export interface IPaymentHandler {
  handlePayment(response: Http402Response): Promise<PaymentResult>;
  verifyPayment(txHash: string): Promise<boolean>;
  getPaymentHistory(): Promise<PaymentRecord[]>;
}
