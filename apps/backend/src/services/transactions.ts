import { BinanceClient } from "../config/binance";
import { DataBaseClient } from "../connections/database";
import {
  BinanceOCOOrder,
  BinanceTransaction,
  ExchangeInfo,
  ExchangeInfoSymbol,
  NewOrderRequest,
  NewOCOOrderRequest,
} from "../models/transactions";

import exchangeInfo from "../config/exchange-info/exchange-info-clean.json";
import { env } from "../config/environment";
import {
  BinanceAccount,
  BinanceError,
  BinanceTradeStream,
  MyTrade,
} from "../models/binance";
import { BinanceOrderDetails } from "../models/orders";

export const getAccount = async (): Promise<BinanceAccount> => {
  return BinanceClient.account()
    .then((response: any) => response.data as BinanceAccount)
    .catch((error: BinanceError) => error.response.data);
};

export const getExchangeInfo = async (): Promise<ExchangeInfo> => {
  if (env.test) {
    return BinanceClient.exchangeInfo()
      .then((response: any) => response.data as ExchangeInfo)
      .catch((err: BinanceError) => {
        console.info(err.response.data);
        throw err.response.data;
      });
  } else return exchangeInfo as any as ExchangeInfo;
};

export const getExchangeInfoSymbols = async (
  symbols: string[]
): Promise<ExchangeInfoSymbol[]> => {
  return BinanceClient.exchangeInfo({ symbols })
    .then((response: any) => response.data as ExchangeInfo)
    .then((exchangeInfo: ExchangeInfo) => exchangeInfo.symbols)
    .catch((err: BinanceError) => {
      console.info(err.response.data);
      throw err.response.data;
    });
};

// **** ORDERS ****

export const newTransaction = async (
  request: NewOrderRequest
): Promise<BinanceTransaction> => {
  return BinanceClient.newOrder(request.symbol, request.side, request.type, {
    quantity: request.quantity,
    newOrderRespType: "FULL",
  })
    .then(
      (response: any) => ({ transaction: response.data } as BinanceTransaction)
    )
    .catch((error: BinanceError) => {
      console.error(error.response.data);
      return { error } as BinanceTransaction;
    });
};

export const newStopLossTakeProfitOrder = async (
  request: NewOCOOrderRequest
): Promise<BinanceTransaction<BinanceOCOOrder>> => {
  return BinanceClient.newOCOOrder(
    request.symbol,
    "SELL",
    request.quantity,
    request.takeProfitPrice,
    request.stopLossPrice,
    {
      stopLimitPrice: request.stopLossPrice,
      stopLimitTimeInForce: request.timeInForce,
      listClientOrderId: request.marketBuyOrderId,
      newOrderRespType: "FULL",
    }
  )
    .then(
      (response: any) =>
        ({ transaction: response.data } as BinanceTransaction<BinanceOCOOrder>)
    )
    .catch((error: BinanceError) => {
      console.error(error.response.data);
      return { error } as BinanceTransaction;
    });
};

// ****

export const getTrades = async (symbol: string): Promise<MyTrade[]> => {
  return BinanceClient.myTrades(symbol).then((response: any) => response.data);
};

export const getTradesByOrderId = async (
  symbol: string,
  orderId: string
): Promise<MyTrade[]> => {
  return BinanceClient.myTrades(symbol, { orderId })
    .then((response: any) => response.data)
    .catch((err: BinanceError) => {
      console.error(err.response.data);
      return err.response.data;
    });
};

export const getTransactions = async (time?: number) => {
  return await DataBaseClient.Transaction.get(time);
};

export const getTransactionById = async (
  symbol: string,
  orderId: string
): Promise<BinanceOrderDetails> => {
  return BinanceClient.getOrder(symbol, { orderId })
    .then((response: any) => response.data)
    .catch((err: BinanceError) => {
      console.error(err.response.data);
      return err.response.data;
    });
};

// *** WEBSOCKET ON NEW TRANSACTION ***

const WS_TRADES = new Map<string, any>(); // LOCAL MAP TO STORE WS REFERENCES

export const subscribeSymbolTrade = (symbol: string, orderIds: string[]) => {
  const callbacks = {
    open: () => console.info(`listening to ${symbol}@trade`),
    close: () => console.info(`closing ${symbol}@trade`),
    message: async (data: string) => {
      const res: BinanceTradeStream = JSON.parse(data);
      const orderId = res.b;
      if (orderIds.includes(orderId)) {
        console.info(`${symbol}@trade`, orderId, res);
        const trades = await getTradesByOrderId(symbol, orderId);
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
};

export const unsubscribeSymbolTrade = (symbol: string) => {
  const wsRef = WS_TRADES.get(symbol);
  if (!wsRef) {
    console.warn(`Warn: no WS for ${symbol}`);
    console.info("Availables WS@trades", WS_TRADES.keys);
    return;
  }
  BinanceClient.unsubscribe(wsRef)
    .then(() => {
      console.info(`Unsubscribed from ${symbol}@trade`);
      WS_TRADES.delete(symbol);
    })
    .catch((err: any) =>
      console.error(`Error unsubscribing from ${symbol}@trade`, err)
    );
};
