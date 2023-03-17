import { BinanceClient } from "../../config/binance";
import { cleanKline } from "./mapping";
import { BinanceInterval } from "./types";

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
      const kline = cleanKline(kline_raw);
      console.log(kline);
    },
    error: (error: Error) => {
      console.log(error);
    },
  };
  return BinanceClient.klineWS(symbol, interval, callbacks);
};

const unsubscribeTickerWS = (wsRef: WebSocket) => {
  BinanceClient.unsubscribe(wsRef);
};

export const trackKlines = async (
  symbol: string,
  interval: BinanceInterval
) => {
  const wsRef = subscribeKlineWS(symbol, interval);
  setTimeout(() => {
    unsubscribeTickerWS(wsRef);
  }, 30000);
};
