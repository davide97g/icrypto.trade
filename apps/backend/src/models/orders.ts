import { BinanceError } from "./binance";
import {
  Fill,
  OrderSide,
  OrderStatus,
  OrderTimeInForce,
  OrderType,
} from "./transactions";

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

export interface BinanceOrderResult<O = Order> {
  order?: O;
  error?: BinanceError;
}
