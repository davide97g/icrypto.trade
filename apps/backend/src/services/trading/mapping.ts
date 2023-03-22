import { KlineData, KlineRecord, KlineWS } from "./types";

export const cleanKline = (kline: KlineWS): KlineData => {
  const { e, E, s, k } = kline;
  const { t, T, s: symbol, i, f, L, o, c, h, l, v, n, x, q, V, Q, B } = k;
  return {
    eventType: e,
    eventTime: E,
    symbol: s,
    kline: {
      startTime: t,
      closeTime: T,
      symbol,
      interval: i,
      firstTradeId: f,
      lastTradeId: L,
      openPrice: o,
      closePrice: c,
      highPrice: h,
      lowPrice: l,
      baseAssetVolume: v,
      numberOfTrades: n,
      isKlineClosed: x,
      quoteAssetVolume: q,
      takerBuyBaseAssetVolume: V,
      takerBuyQuoteAssetVolume: Q,
      ignore: B,
    },
  };
};

export const buildKlineRecord = (kline: any[]) => {
  return {
    openTime: kline[0],
    openPrice: kline[1],
    highPrice: kline[2],
    lowPrice: kline[3],
    closePrice: kline[4],
    volume: kline[5],
    closeTime: kline[6],
    quoteAssetVolume: kline[7],
    numberOfTrades: kline[8],
    takerBuyBaseAssetVolume: kline[9],
    takerBuyQuoteAssetVolume: kline[10],
    ignore: kline[11],
  } as KlineRecord;
};
