import { BinanceClient } from "../../config/binance";
import { BinanceError, MyTrade } from "../../models/binance";

export const getBinanceTrades = async (symbol: string) => {
  return BinanceClient.myTrades(symbol)
    .then((response: any) => response.data as MyTrade[])
    .catch((error: BinanceError) => error.response.data);
};

export const getBinanceTradesByOrderId = async (
  symbol: string,
  orderId: number
): Promise<MyTrade[]> => {
  return BinanceClient.myTrades(symbol, { orderId })
    .then((response: any) => response.data)
    .catch((err: BinanceError) => {
      console.error(err.response.data);
      return err.response.data;
    });
};
