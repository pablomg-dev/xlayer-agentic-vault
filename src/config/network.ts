export interface NetworkConfig {
  chainId: number;
  rpcUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorer: string;
}

export const XLAYER_CONFIG: NetworkConfig = {
  chainId: 196,
  rpcUrl: process.env.RPC_URL ?? "https://rpc.xlayer.tech",
  nativeCurrency: {
    name: "OKB",
    symbol: "OKB",
    decimals: 18,
  },
  blockExplorer: "https://www.oklink.com/xlayer",
};
