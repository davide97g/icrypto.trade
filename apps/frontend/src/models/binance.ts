import { OrderSide, OrderStatus, OrderTimeInForce, OrderType } from "./types";

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

export interface BinanceOrderShort {
  symbol: string;
  orderId: number;
  clientOrderId: string;
}

export interface BinanceOrderReport {
  symbol: string;
  orderId: number;
  orderListId: number;
  clientOrderId: string;
  transactTime: number;
  price: string;
  origQty: string;
  executedQty: string;
  cummulativeQuoteQty: string;
  status: OrderStatus;
  timeInForce: OrderTimeInForce;
  type: OrderType;
  side: OrderSide;
  stopPrice: string;
}

export interface BinanceOCOOrder {
  orderListId: number;
  contingencyType: string;
  listStatusType: string;
  listOrderStatus: string;
  listClientOrderId: string;
  transactionTime: number;
  symbol: string;
  orders: BinanceOrderShort[];
  orderReports: BinanceOrderReport[];
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
