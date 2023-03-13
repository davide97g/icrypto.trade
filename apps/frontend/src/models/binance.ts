export interface BinanceErrorData {
  code: number;
  msg: string;
}
export interface BinanceError {
  config: any;
  code: string;
  request: any;
  response: {
    status: number;
    statusText: string;
    headers: any;
    config: any;
    request: any;
    data: BinanceErrorData;
  };
}
export interface BinanceAccount {
  makerCommission: number;
  takerCommission: number;
  buyerCommission: number;
  sellerCommission: number;
  canTrade: boolean;
  canWithdraw: boolean;
  canDeposit: boolean;
  brokered: boolean;
  updateTime: number;
  accountType: string;
  balances: BinanceBalance[];
  permissions: string[];
}
export interface BinanceBalance {
  asset: string;
  free: string;
  locked: string;
}
