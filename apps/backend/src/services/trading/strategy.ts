import { BinanceClient } from "../../config/binance";
import { NewOCOOrderRequest } from "../../models/orders";
import { cancelOCOOrder, newOCOOrder } from "../orders";
import { cleanKline } from "./mapping";
import { BinanceInterval, Kline } from "./types";
import { WebSocket } from "ws";

const subscribeKlineWS = (symbol: string, interval: BinanceInterval) => {
  const callbacks = {
    open: () => {
      console.log(`open klines@${symbol}`);
    },
    close: () => {
      console.log(`close klines@${symbol}`);
    },
    message: (msg: string) => {
      const kline_raw = JSON.parse(msg);
      const klineData = cleanKline(kline_raw);
      onNewKline(symbol, klineData.kline);
    },
    error: (error: Error) => {
      console.log(error);
    },
  };
  return BinanceClient.klineWS(symbol, interval, callbacks);
};

export const unsubscribeKlineWS = (symbol: string) => {
  const strategy = STRATEGY_MAP.get(symbol);
  if (!strategy) return;
  const { wsRef } = strategy;
  BinanceClient.unsubscribe(wsRef);
  removeStrategy(symbol);
};

export const trackKlines = (
  symbol: string,
  request: NewOCOOrderRequest,
  orderListId: number
) => {
  const wsRef = subscribeKlineWS(symbol, "1m");
  addStrategy(symbol, orderListId, request, wsRef);
  // setTimeout(() => {
  //   unsubscribeTickerWS(symbol, wsRef);
  // }, 60000);
};

interface Strategy {
  wsRef: WebSocket;
  lastOrderListId: number;
  lastOcoOrderRequest: NewOCOOrderRequest;
  data: Kline[];
}

const STRATEGY_MAP = new Map<string, Strategy>(); // LOCAL MAP TO STORE WS REFERENCES

const addStrategy = (
  symbol: string,
  orderListId: number,
  request: NewOCOOrderRequest,
  wsRef: WebSocket
) => {
  const strategy: Strategy = {
    lastOrderListId: orderListId,
    lastOcoOrderRequest: request,
    data: [],
    wsRef,
  };
  STRATEGY_MAP.set(symbol, strategy);
};

const updateStrategy = (
  symbol: string,
  orderListId: number,
  request: NewOCOOrderRequest
) => {
  const strategy = STRATEGY_MAP.get(symbol);
  if (strategy) {
    strategy.lastOrderListId = orderListId;
    strategy.lastOcoOrderRequest = request;
  }
};

const removeStrategy = (symbol: string) => {
  STRATEGY_MAP.delete(symbol);
};

const onNewKline = (symbol: string, kline: Kline) => {
  if (!STRATEGY_MAP.has(symbol)) return;
  const strategy = STRATEGY_MAP.get(symbol);
  if (!strategy) return;
  strategy.data.push(kline);
  console.info("new kline");
  analyzeStrategy(strategy);
};

const analyzeStrategy = async (strategy: Strategy) => {
  const { data } = strategy;
  const lastKline = data[data.length - 1];

  if (
    !needsUpdate(
      lastKline,
      strategy.lastOcoOrderRequest.takeProfitPrice,
      strategy.lastOcoOrderRequest.stopLossPrice
    )
  )
    return;

  const request = createOCOOrderRequest(
    strategy.lastOcoOrderRequest,
    data,
    lastKline
  );

  await cancelReplaceOCOOrder(
    request.symbol,
    strategy.lastOrderListId.toString(),
    request
  );
};

const needsUpdate = (
  lastKline: Kline,
  lastTakeProfitPrice: number,
  lastStopLossPrice: number
) => {
  // TODO: implement this
  return false;
};

const createOCOOrderRequest = (
  lastOcoOrderRequest: NewOCOOrderRequest,
  data: Kline[],
  lastKline: Kline
) => {
  // TODO: compute new prices based on kline data
  const request: NewOCOOrderRequest = {
    symbol: lastOcoOrderRequest.symbol,
    quantity: lastOcoOrderRequest.quantity,
    takeProfitPrice: lastOcoOrderRequest.takeProfitPrice,
    stopLossPrice: lastOcoOrderRequest.stopLossPrice,
    timeInForce: "GTC",
  };
  return request;
};

const cancelReplaceOCOOrder = async (
  symbol: string,
  orderListId: string,
  request: NewOCOOrderRequest
) => {
  await cancelOCOOrder(symbol, orderListId);
  const ocoOrder = await newOCOOrder(request);
  updateStrategy(symbol, ocoOrder.orderListId, request);
};
