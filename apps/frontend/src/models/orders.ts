import { BinanceError } from "./binance";
import { OrderSide, OrderStatus, OrderTimeInForce, OrderType } from "./types";

export interface Fill {
  price: string;
  qty: string;
  commission: string;
  commissionAsset: string;
  tradeId: number;
}

export interface BinanceOrderDetails {
  symbol: string;
  orderId: number;
  orderListId: number;
  clientOrderId: string;
  price: string;
  origQty: string;
  executedQty: string;
  cummulativeQuoteQty: string;
  status: string;
  timeInForce: string;
  type: string;
  side: string;
  stopPrice: string;
  icebergQty: string;
  time: number;
  updateTime: number;
  isWorking: boolean;
  origQuoteOrderQty: string;
}

export interface Order {
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

// RESPONSE

export interface BinanceOrderResult<O = Order> {
  order?: O;
  error?: BinanceError;
}

export interface BinanceOrderResponse {
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

// REQUESTS
export interface NewOrderRequest {
  symbol: string;
  side: OrderSide;
  type: OrderType;
  timeInForce: OrderTimeInForce;
  quantity: number;
  precision: number;
}

export interface NewOCOOrderRequest {
  symbol: string;
  quantity: number;
  takeProfitPrice: number;
  stopLossPrice: number;
  timeInForce: OrderTimeInForce;
}
