import { Kline, KlineWS } from "./types";

export const cleanKline = (kline: KlineWS): Kline => {
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
