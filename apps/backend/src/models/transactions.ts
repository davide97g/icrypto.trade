import { BinanceError } from "./binance";

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

// T default is Transaction

export interface BinanceTransaction<T = Transaction> {
  transaction?: T;
  error?: BinanceError;
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
  timeInForce: OrderTimeInForce;
  quantity: number;
  precision: number;
}

export interface NewTakeProfitStopLossRequest {
  symbol: string;
  quantity: number;
  stopPrice: number;
  timeInForce: OrderTimeInForce;
}

export interface NewTakeProfitStopLossLimitRequest {
  symbol: string;
  quantity: number;
  price: number;
  stopPrice: number;
  timeInForce: OrderTimeInForce;
}

export interface StopLossTakeProfitRequest {
  symbol: string;
  quantity: number;
  takeProfitPrice: number;
  stopLossPrice: number;
  marketBuyOrderId: number;
  timeInForce: OrderTimeInForce;
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
  baseCommissionPrecision: number;
  quoteCommissionPrecision: number;
  orderTypes: OrderType[];
  icebergAllowed: boolean;
  ocoAllowed: boolean;
  quoteOrderQtyMarketAllowed: boolean;
  isSpotTradingAllowed: boolean;
  isMarginTradingAllowed: boolean;
  filters: ExchangeInfoSymbolFilter[];
  permissions: string[];
}

export interface ExchangeInfoSymbolFilter {
  filterType: string;
  minPrice?: string;
  maxPrice?: string;
  tickSize?: string;
  minQty?: string;
  maxQty?: string;
  stepSize?: string;
  minNotional?: string;
  applyToMarket?: boolean;
  limit?: number;
  maxNumAlgoOrders?: number;
  bidMultiplierUp?: string;
  bidMultiplierDown?: string;
  askMultiplierUp?: string;
  askMultiplierDown?: string;
  avgPriceMins?: number;
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

export type KlineInterval =
  | "1s"
  | "1m"
  | "3m"
  | "5m"
  | "15m"
  | "30m"
  | "1h"
  | "2h"
  | "4h"
  | "6h"
  | "8h"
  | "12h"
  | "1d"
  | "3d"
  | "1w"
  | "1M";

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
