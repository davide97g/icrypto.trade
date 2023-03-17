export interface BinanceResponse<D, E = BinanceErrorData> {
  data?: D;
  error?: E;
}
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

export interface BinanceTicker {
  symbol: string;
  price: string;
}

export interface MyTrade {
  symbol: string;
  id: number;
  orderId: number;
  orderListId: number;
  price: string;
  qty: string;
  quoteQty: string;
  commission: string;
  commissionAsset: string;
  time: number;
  isBuyer: boolean;
  isMaker: boolean;
  isBestMatch: boolean;
}

export interface BinanceTradeStream {
  e: string; // event type
  E: number; // event time
  s: string; // Option trading symbol
  t: number; // trade ID
  p: string; // price
  q: string; // quantity
  b: string; // buy order ID
  a: string; // sell order ID
  T: number; // trade completed time
  S: string; // direction
}
