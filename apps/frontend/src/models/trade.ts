export type OrderType =
  | "LIMIT"
  | "MARKET"
  | "STOP_LOSS"
  | "STOP_LOSS_LIMIT"
  | "TAKE_PROFIT"
  | "TAKE_PROFIT_LIMIT"
  | "LIMIT_MAKER";

export type OrderSide = "BUY" | "SELL";

export type OrderTimeInForce = "GTC" | "IOC" | "FOK";

export type OrderResponseType = "ACK" | "RESULT" | "FULL";

// Status	Description
// NEW	The order has been accepted by the engine.
// PARTIALLY_FILLED	A part of the order has been filled.
// FILLED	The order has been completed.
// CANCELED	The order has been canceled by the user.
// PENDING_CANCEL	Currently unused
// REJECTED	The order was not accepted by the engine and not processed.
// EXPIRED	The order was canceled according to the order type's rules (e.g. LIMIT FOK orders with no fill, LIMIT IOC or MARKET orders that partially fill) or by the exchange, (e.g. orders canceled during liquidation, orders canceled during maintenance)
// EXPIRED_IN_MATCH	The order was canceled by the exchange due to STP trigger. (e.g. an order with EXPIRE_TAKER will match with existing orders on the book with the same account or same tradeGroupId)

export type OrderStatus =
  | "NEW"
  | "PARTIALLY_FILLED"
  | "FILLED"
  | "CANCELED"
  | "PENDING_CANCEL"
  | "REJECTED"
  | "EXPIRED"
  | "EXPIRED_IN_MATCH";

export interface NewOrderRequest {
  symbol: string;
  side: OrderSide;
  type: OrderType;
  timeInForce?: OrderTimeInForce;
  quantity?: number;
  price?: number;
}

export interface Asset {
  asset: string;
  free: string;
  locked: string;
}

export interface Account {
  makerCommission: number;
  takerCommission: number;
  buyerCommission: number;
  sellerCommission: number;
  commissionRates: {
    maker: string;
    taker: string;
    buyer: string;
    seller: string;
  };
  canTrade: boolean;
  canWithdraw: boolean;
  canDeposit: boolean;
  brokered: boolean;
  requireSelfTradePrevention: boolean;
  updateTime: number;
  accountType: "SPOT" | "MARGIN" | "FUTURES";
  balances: Asset[];
  permissions: string[];
}
export interface Transaction {
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
  workingTime: number;
  fills: Fill[];
  selfTradePreventionMode: string;
}

export interface Fill {
  price: string;
  qty: string;
  commission: string;
  commissionAsset: string;
  tradeId: number;
}

export interface TradeConfig {
  feedLimit: number; // number of feed items to fetch
  feedUpdateInterval: number; // seconds between feed updates
  goodNewsUpdateInterval: number; // seconds between good news updates
  TTL: number; // seconds before a news is considered "old"
  nLikes: number;
  nMinutes: number;
  takeProfitPercentage: number;
  stopLossPercentage: number;
  mockSymbol: boolean;
  tradeAmount: number;
}

export interface ExchangeInfo {
  timezone: string;
  serverTime: number;
  rateLimits: [];
  exchangeFilters: [];
  symbols: ExchangeInfoSymbol[];
}

export interface ExchangeInfoSymbol {
  symbol: string;
  status: string;
  baseAsset: string;
  baseAssetPrecision: number;
  quoteAsset: string;
  quotePrecision: number;
  quoteAssetPrecision: number;
}

export interface Kline {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteAssetVolume: string;
  numberOfTrades: number;
  takerBuyBaseAssetVolume: string;
  takerBuyQuoteAssetVolume: string;
  ignore: string;
}

export interface BinanceOrder {
  symbol: string;
  origClientOrderId: string;
  orderId: number;
  orderListId: number;
  clientOrderId: string;
  price: string;
  origQty: string;
  executedQty: string;
  cummulativeQuoteQty: string;
  status: OrderStatus;
  timeInForce: OrderTimeInForce;
  type: OrderType;
  side: OrderSide;
}
