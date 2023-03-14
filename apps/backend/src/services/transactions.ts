import { BinanceClient } from "../config/binance";
import { DataBaseClient } from "../connections/database";
import {
  BinanceOCOOrder,
  BinanceTransaction,
  ExchangeInfo,
  ExchangeInfoSymbol,
  NewOrderRequest,
  NewTakeProfitStopLossLimitRequest,
  StopLossTakeProfitRequest,
} from "../models/transactions";

import exchangeInfo from "../config/exchange-info/exchange-info-clean.json";
import { env } from "../config/environment";
import { BinanceAccount, BinanceError } from "../models/binance";
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

export const takeProfitOrder = async (
  request: NewTakeProfitStopLossLimitRequest
): Promise<BinanceTransaction> => {
  return BinanceClient.newOrder(request.symbol, "SELL", "TAKE_PROFIT_LIMIT", {
    stopPrice: request.stopPrice,
    quantity: request.quantity,
    price: request.price,
    newOrderRespType: "FULL",
    timeInForce: request.timeInForce,
  })
    .then(
      (response: any) => ({ transaction: response.data } as BinanceTransaction)
    )
    .catch((error: BinanceError) => {
      console.error(error.response.data);
      return { error } as BinanceTransaction;
    });
};

export const stopLossOrder = async (
  request: NewTakeProfitStopLossLimitRequest
): Promise<BinanceTransaction> => {
  return BinanceClient.newOrder(request.symbol, "SELL", "STOP_LOSS_LIMIT", {
    stopPrice: request.stopPrice,
    quantity: request.quantity,
    price: request.price,
    newOrderRespType: "FULL",
    timeInForce: request.timeInForce,
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
  request: StopLossTakeProfitRequest
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

export const getTrades = async (symbol: string) => {
  return BinanceClient.myTrades(symbol).then((response: any) => response.data);
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
