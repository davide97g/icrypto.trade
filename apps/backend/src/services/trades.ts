import { BinanceClient } from "../config/binance";
import { DataBaseClient } from "../connections/database";
import { BinanceError, BinanceTradeStream, MyTrade } from "../models/binance";
import { getBinanceTradesByOrderId } from "./binance/trade";
import { unsubscribeKlineWS } from "./trading/strategy";

// ****

export const getTrades = async (options?: {
  time?: number;
  symbol?: string;
}) => {
  return await DataBaseClient.Trade.get(options);
};

export const getTradeById = async (id: string) => {
  return await DataBaseClient.Trade.getById(id);
};

// *** WEBSOCKET ON NEW TRANSACTION ***

const WS_TRADES = new Map<string, any>(); // LOCAL MAP TO STORE WS REFERENCES

export const subscribeSymbolTrade = (symbol: string, orderIds: number[]) => {
  const callbacks = {
    open: () => console.info(`listening to ${symbol}@trade`),
    close: () => console.info(`closing ${symbol}@trade`),
    message: async (data: string) => {
      const res: BinanceTradeStream = JSON.parse(data);
      const orderId = parseInt(res.b);
      if (orderIds.includes(orderId)) {
        console.info(`${symbol}@trade`, orderId, res);
        const trades = await getBinanceTradesByOrderId(symbol, orderId);
        await DataBaseClient.Trade.insertMany(trades);
        unsubscribeSymbolTrade(symbol);
      }
    },
    error: (error: any) => console.error(`${symbol}@trade`, error),
  };
  const wsRef = BinanceClient.tradeWS(symbol, callbacks);
  if (!wsRef) {
    console.error(`Error subscribing to ${symbol}@trade`);
    return;
  }
  WS_TRADES.set(symbol, wsRef);
  setTimeout(() => {
    unsubscribeSymbolTrade(symbol);
  }, 1000 * 60 * 60); // 5 minutes
};

export const unsubscribeSymbolTrade = (symbol: string) => {
  unsubscribeKlineWS(symbol);
  const wsRef = WS_TRADES.get(symbol);
  if (!wsRef) {
    console.warn(`Warn: no WS for ${symbol}`);
    console.info("Availables WS@trades", WS_TRADES.keys);
    return;
  }
  BinanceClient.unsubscribe(wsRef);
  console.info(`Unsubscribed from ${symbol}@trade`);
  WS_TRADES.delete(symbol);
};
