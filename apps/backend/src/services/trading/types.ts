export interface KlineWS {
  e: string;
  E: number;
  s: string;
  k: {
    t: number;
    T: number;
    s: string;
    i: string;
    f: number;
    L: number;
    o: string;
    c: string;
    h: string;
    l: string;
    v: string;
    n: number;
    x: boolean;
    q: string;
    V: string;
    Q: string;
    B: string;
  };
}

export interface Kline {
  eventType: string;
  eventTime: number;
  symbol: string;
  kline: {
    startTime: number;
    closeTime: number;
    symbol: string;
    interval: string;
    firstTradeId: number;
    lastTradeId: number;
    openPrice: string;
    closePrice: string;
    highPrice: string;
    lowPrice: string;
    baseAssetVolume: string;
    numberOfTrades: number;
    isKlineClosed: boolean;
    quoteAssetVolume: string;
    takerBuyBaseAssetVolume: string;
    takerBuyQuoteAssetVolume: string;
    ignore: string;
  };
}

export type BinanceInterval =
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
