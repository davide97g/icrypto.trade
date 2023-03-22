import { env } from "../../config/environment";
import exchangeInfo from "../../config/exchange-info/exchange-info-clean.json";
import { BinanceClient } from "../../config/binance";
import {
  BinanceAccount,
  ExchangeInfo,
  ExchangeInfoSymbol,
} from "../../models/account";
import {
  BinanceError,
  BinanceErrorData,
  BinanceResponse,
} from "../../models/binance";
import { BinanceInterval, KlineRecord } from "../trading/types";
import { buildKlineRecord } from "../trading/mapping";

export const getAccount = async (): Promise<
  BinanceResponse<BinanceAccount>
> => {
  return BinanceClient.account()
    .then((response: any) => ({ data: response.data as BinanceAccount }))
    .catch((error: BinanceError) => ({
      error: error.response.data as BinanceErrorData,
    }));
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

export const getExchangeInfoSymbol = async (
  symbol: string
): Promise<ExchangeInfoSymbol> => {
  return BinanceClient.exchangeInfo({ symbol })
    .then((response: any) => response.data as ExchangeInfo)
    .then((exchangeInfo: ExchangeInfo) => exchangeInfo.symbols)
    .catch((err: BinanceError) => {
      console.info(err.response.data);
      throw err.response.data;
    });
};

export const getKlines = async (
  symbol: string,
  interval?: BinanceInterval,
  limit?: number
): Promise<KlineRecord[]> => {
  return BinanceClient.klines(symbol, interval || "1m", { limit })
    .then((response: any) => response.data as any[])
    .then((klines: any[]) =>
      klines.map((kline: any) => buildKlineRecord(kline))
    )
    .catch((err: BinanceError) => {
      console.info(err.response.data);
      throw err.response.data;
    });
};
