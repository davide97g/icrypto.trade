import { WebSocket } from "ws";
import { BinanceClient } from "../config/binance";

interface TickerWS {
  e: string; // Event type
  E: number; // Event time
  s: string; // Symbol
  p: string; // Price change
  P: string; // Price change percent
  w: string; // Weighted average price
  x: string; // First trade(F)-1 price (first trade before the 24hr rolling window)
  c: string; // Last price
  Q: string; // Last quantity
  b: string; // Best bid price
  B: string; // Best bid quantity
  a: string; // Best ask price
  A: string; // Best ask quantity
  o: string; // Open price
  h: string; // High price
  l: string; // Low price
  v: string; // Total traded base asset volume
  q: string; // Total traded quote asset volume
  O: number; // Statistics open time
  C: number; // Statistics close time
  F: number; // First trade ID
  L: number; // Last trade Id
  n: number; // Total number of trades
}

interface Ticker {
  eventType: string;
  eventTime: number;
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  firstTradePrice: string;
  lastPrice: string;
  lastQty: string;
  bestBidPrice: string;
  bestBidQty: string;
  bestAskPrice: string;
  bestAskQty: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  totalTradedBaseAssetVolume: string;
  totalTradedQuoteAssetVolume: string;
  statisticsOpenTime: number;
  statisticsCloseTime: number;
  firstTradeId: number;
  lastTradeId: number;
  totalNumberOfTrades: number;
}

const cleanTicker = (ticker: TickerWS): Ticker => {
  return {
    eventType: ticker.e,
    eventTime: ticker.E,
    symbol: ticker.s,
    priceChange: ticker.p,
    priceChangePercent: ticker.P,
    weightedAvgPrice: ticker.w,
    firstTradePrice: ticker.x,
    lastPrice: ticker.c,
    lastQty: ticker.Q,
    bestBidPrice: ticker.b,
    bestBidQty: ticker.B,
    bestAskPrice: ticker.a,
    bestAskQty: ticker.A,
    openPrice: ticker.o,
    highPrice: ticker.h,
    lowPrice: ticker.l,
    totalTradedBaseAssetVolume: ticker.v,
    totalTradedQuoteAssetVolume: ticker.q,
    statisticsOpenTime: ticker.O,
    statisticsCloseTime: ticker.C,
    firstTradeId: ticker.F,
    lastTradeId: ticker.L,
    totalNumberOfTrades: ticker.n,
  };
};

const subscribeTickerWS = (symbol: string) => {
  const callbacks = {
    open: () => console.info(`listening to ${symbol}@ticker`),
    close: () => console.info(`closing ${symbol}@ticker`),
    message: async (data: string) => {
      const ticker = cleanTicker(JSON.parse(data) as TickerWS);
      console.info(ticker.weightedAvgPrice, ticker.lastPrice);
    },
    error: (error: any) => console.error(`${symbol}@ticker`, error),
  };
  return BinanceClient.tickerWS(symbol, callbacks);
};

const unsubscribeTickerWS = (wsRef: WebSocket) => {
  BinanceClient.unsubscribe(wsRef);
};

export const trackTickerWS = async (symbol: string) => {
  const wsRef = subscribeTickerWS(symbol);
  setTimeout(() => {
    unsubscribeTickerWS(wsRef);
  }, 10000);
};
