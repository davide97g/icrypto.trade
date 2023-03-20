import { BinanceClient } from "../config/binance";
import { DataBaseClient } from "../connections/database";
import { BinanceError, MyTrade } from "../models/binance";
import { FeedItem } from "../models/feed";
import {
  BinanceOCOOrder,
  BinanceOrderDetails,
  BinanceOrderResponse,
  NewOCOOrderRequest,
  NewOrderRequest,
  Order,
} from "../models/orders";
import { getAccount, getExchangeInfo } from "./binance/market";
import { getBinanceTradesByOrderId } from "./binance/trade";

export const getOpenOrders = async (symbol: string) => {
  return BinanceClient.openOrders(symbol)
    .then((response: any) => response.data as BinanceOrderDetails)
    .catch((error: BinanceError) => error.response.data);
};

export const getOrderById = async (
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

export const createOrder = async (symbol: string, newsId: string) => {
  const tradeConfig = await DataBaseClient.Bot.getTradeConfig();
  if (!tradeConfig) throw new Error("Trade config not found");
  const news: FeedItem = await DataBaseClient.GoodFeedItem.getById(newsId);
  news.symbolsGuess = [...news.symbolsGuess, symbol];
  // TODO: buy news
};

export const cancelOrder = async (
  symbol: string,
  orderId: string
): Promise<BinanceOrderResponse> => {
  return BinanceClient.cancelOrder(symbol, {
    orderId,
  })
    .then((response: any) => response.data as BinanceOrderResponse)
    .catch((err: BinanceError) => {
      console.error(err.response.data);
      return err.response.data;
    });
};

export const cancelAllOpenOrders = async (
  symbol: string
): Promise<BinanceOrderResponse[]> => {
  return BinanceClient.cancelOpenOrders(symbol)
    .then((response: any) => response.data as BinanceOrderResponse[])
    .catch((error: BinanceError) => error.response.data);
};

export const sellAll = async (symbol: string) => {
  // quantity = all available from account
  const accountResult = await getAccount();
  if (!accountResult.data) throw accountResult.error;
  const account = accountResult.data;
  const balance = account.balances.find((b) => symbol.startsWith(b.asset));
  if (!balance) throw new Error("Balance not found");

  const quantity = parseFloat(balance.free);

  const exchangeInfo = await getExchangeInfo();
  const symbolInfo = exchangeInfo.symbols.find((s) => s.symbol === symbol);
  if (!symbolInfo) throw new Error("Symbol not found");

  const filterLotSize = symbolInfo.filters.find(
    (f) => f.filterType === "LOT_SIZE"
  );
  if (!filterLotSize) throw new Error("Lot size filter not found");
  const maxLotSizeQty = parseFloat(filterLotSize?.maxQty || "0");

  const marketLostSize = symbolInfo.filters.find(
    (f) => f.filterType === "MARKET_LOT_SIZE"
  );
  if (!marketLostSize) throw new Error("Market lot size filter not found");
  const maxMarketLotSizeQty = parseFloat(marketLostSize?.maxQty || "0");

  const maxQty = Math.min(maxLotSizeQty, maxMarketLotSizeQty);

  const marketSellRequest: NewOrderRequest = {
    symbol,
    side: "SELL",
    type: "MARKET",
    quantity: quantity > maxQty ? maxQty : quantity,
    timeInForce: "GTC",
    precision: symbolInfo.baseAssetPrecision,
  };
  return newOrder(marketSellRequest);
};

export const newOrder = async (
  { symbol, side, type, quantity }: NewOrderRequest,
  options?: { saveTransaction?: boolean }
): Promise<Order> => {
  return BinanceClient.newOrder(symbol, side, type, {
    quantity,
    newOrderRespType: "FULL",
  })
    .then(async (response: any) => {
      const order = response.data as Order;
      if (options?.saveTransaction) {
        const trades = await getBinanceTradesByOrderId(
          order.symbol,
          order.orderId
        );
        await DataBaseClient.Trade.insertMany(trades);
      }
      return order;
    })
    .catch((error: BinanceError) => {
      const { code, msg } = error.response.data;
      console.error(code, msg);
      throw { code, msg };
    });
};

export const newOCOOrder = async ({
  symbol,
  quantity,
  takeProfitPrice,
  stopLossPrice: stopLimitPrice,
  timeInForce: stopLimitTimeInForce,
  marketBuyOrderId: listClientOrderId,
}: NewOCOOrderRequest): Promise<BinanceOCOOrder> => {
  return BinanceClient.newOCOOrder(
    symbol,
    "SELL",
    quantity,
    takeProfitPrice,
    stopLimitPrice,
    {
      stopLimitPrice,
      stopLimitTimeInForce,
      listClientOrderId,
      newOrderRespType: "FULL",
    }
  )
    .then((response: any) => response.data as BinanceOCOOrder)
    .catch((error: BinanceError) => {
      const { code, msg } = error.response.data;
      console.error(code, msg);
      throw { code, msg };
    });
};
