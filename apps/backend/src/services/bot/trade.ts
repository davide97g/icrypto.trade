import { WebSocket } from "ws";
import { BinanceClient } from "../../config/binance";
import { BinanceTicker } from "../../models/binance";
import {
  NewOCOOrderRequest,
  NewOrderRequest,
  Order,
} from "../../models/orders";
import { roundToNDigits } from "../../utils/utils";
import { sendErrorMail, sendOrderMail } from "../mail";
import { newOrder, newOCOOrder } from "../orders";
import { subscribeSymbolTrade } from "../trades";
import { DataBaseClient } from "../../connections/database";
import { ExchangeInfoSymbol } from "../../models/account";
import { TradeConfig } from "../../models/bot";
import { getBinanceTradesByOrderId } from "../binance/trade";
import {
  findTickerPrice,
  calculateOrderQuantity,
  computeQuantity,
  calculateAvgMarketBuyPrice,
  computePrice,
} from "../trading/utils";
import { startStrategy } from "../trading/strategy";

interface TickerWS {
  e: string; // Event type
  E: number; // Event time
  s: string; // Symbol
  p: string; // Price change
  P: string; // Price change percent
  w: string; // Weighted average price
  x: string; // First trade(F)-1 price (first trade before the 24hr rolling window)
  c: string; // Last price
  Q: string; // Last quantity
  b: string; // Best bid price
  B: string; // Best bid quantity
  a: string; // Best ask price
  A: string; // Best ask quantity
  o: string; // Open price
  h: string; // High price
  l: string; // Low price
  v: string; // Total traded base asset volume
  q: string; // Total traded quote asset volume
  O: number; // Statistics open time
  C: number; // Statistics close time
  F: number; // First trade ID
  L: number; // Last trade Id
  n: number; // Total number of trades
}

interface Ticker {
  eventType: string;
  eventTime: number;
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  firstTradePrice: string;
  lastPrice: string;
  lastQty: string;
  bestBidPrice: string;
  bestBidQty: string;
  bestAskPrice: string;
  bestAskQty: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  totalTradedBaseAssetVolume: string;
  totalTradedQuoteAssetVolume: string;
  statisticsOpenTime: number;
  statisticsCloseTime: number;
  firstTradeId: number;
  lastTradeId: number;
  totalNumberOfTrades: number;
}

const cleanTicker = (ticker: TickerWS): Ticker => {
  return {
    eventType: ticker.e,
    eventTime: ticker.E,
    symbol: ticker.s,
    priceChange: ticker.p,
    priceChangePercent: ticker.P,
    weightedAvgPrice: ticker.w,
    firstTradePrice: ticker.x,
    lastPrice: ticker.c,
    lastQty: ticker.Q,
    bestBidPrice: ticker.b,
    bestBidQty: ticker.B,
    bestAskPrice: ticker.a,
    bestAskQty: ticker.A,
    openPrice: ticker.o,
    highPrice: ticker.h,
    lowPrice: ticker.l,
    totalTradedBaseAssetVolume: ticker.v,
    totalTradedQuoteAssetVolume: ticker.q,
    statisticsOpenTime: ticker.O,
    statisticsCloseTime: ticker.C,
    firstTradeId: ticker.F,
    lastTradeId: ticker.L,
    totalNumberOfTrades: ticker.n,
  };
};

const subscribeTickerWS = (symbol: string) => {
  const callbacks = {
    open: () => console.info(`listening to ${symbol}@ticker`),
    close: () => console.info(`closing ${symbol}@ticker`),
    message: async (data: string) => {
      const ticker = cleanTicker(JSON.parse(data) as TickerWS);
      console.info(ticker.weightedAvgPrice, ticker.lastPrice);
    },
    error: (error: any) => console.error(`${symbol}@ticker`, error),
  };
  return BinanceClient.tickerWS(symbol, callbacks);
};

const unsubscribeTickerWS = (wsRef: WebSocket) => {
  BinanceClient.unsubscribe(wsRef);
};

export const trackTickerWS = async (symbol: string) => {
  const wsRef = subscribeTickerWS(symbol);
  setTimeout(() => {
    unsubscribeTickerWS(wsRef);
  }, 10000);
};

export const trade = async (
  newsId: string,
  exchangeInfoSymbol: ExchangeInfoSymbol,
  tradeConfig: TradeConfig,
  tickersPrice: BinanceTicker[]
) => {
  console.info("Trade", newsId, exchangeInfoSymbol.symbol, tradeConfig);
  try {
    const marketOrder = await newMarketOrder(
      exchangeInfoSymbol,
      tradeConfig,
      tickersPrice
    );
    console.info("Market Order", marketOrder);
    const trades = await getBinanceTradesByOrderId(
      exchangeInfoSymbol.symbol,
      marketOrder.orderId
    );
    if (trades.length === 0) {
      throw new Error(
        "No trades found for market order: " + marketOrder.orderId
      );
    }
    await DataBaseClient.Trade.insertMany(trades);
    try {
      const ocoOrder = await newTPSLOrder(
        exchangeInfoSymbol,
        tradeConfig,
        marketOrder,
        newsId
      );
      const orderIds = ocoOrder.orders.map((o) => o.orderId);
      subscribeSymbolTrade(exchangeInfoSymbol.symbol, orderIds);
      await DataBaseClient.GoodFeedItem.updateStatus(newsId, "success");
      await sendOrderMail(marketOrder, {
        order: ocoOrder,
      });
    } catch (e: any) {
      console.error("[Error OCO Order]", e);
      await DataBaseClient.GoodFeedItem.updateStatus(newsId, "oco-error");
      await sendOrderMail(marketOrder, {
        error: e,
      });
    }
  } catch (error) {
    console.error("[Error MARKET Order]", error);
    await DataBaseClient.GoodFeedItem.updateStatus(newsId, "market-error");
    await sendErrorMail(
      `[Error MARKET Order] [${exchangeInfoSymbol.symbol}]`,
      `There was an error with MARKET ORDER for the news ${newsId}`,
      error
    );
  }
};

const newMarketOrder = async (
  exchangeInfoSymbol: ExchangeInfoSymbol,
  tradeConfig: TradeConfig,
  tickerPrices: BinanceTicker[]
) => {
  console.info("New Market Order", exchangeInfoSymbol.symbol);

  const precision = exchangeInfoSymbol.quoteAssetPrecision || 8;
  const tickerPriceObj = findTickerPrice(
    exchangeInfoSymbol.symbol,
    tickerPrices
  );
  const tickerPrice = roundToNDigits(
    parseFloat(tickerPriceObj?.price || "0"),
    precision - 1
  );

  console.info("📈", tickerPrice, exchangeInfoSymbol.symbol);

  const orderQty = calculateOrderQuantity(
    tradeConfig.tradeAmount,
    tickerPrice,
    precision
  );
  const quantity = computeQuantity(exchangeInfoSymbol, orderQty, precision);

  const newOrderRequest: NewOrderRequest = {
    symbol: exchangeInfoSymbol.symbol,
    quantity,
    precision,
    side: "BUY",
    type: "MARKET",
    timeInForce: "GTC",
  };

  return newOrder(newOrderRequest);
};

const newTPSLOrder = async (
  exchangeInfoSymbol: ExchangeInfoSymbol,
  tradeConfig: TradeConfig,
  marketOrder: Order,
  newsId: string
) => {
  console.info("New OCO order", exchangeInfoSymbol.symbol);

  const precision = exchangeInfoSymbol.baseAssetPrecision || 8;
  const quantityWithCommission = marketOrder.fills.reduce(
    (acc, fill) => acc + parseFloat(fill.qty) - parseFloat(fill.commission),
    0
  );
  const quantity = computeQuantity(
    exchangeInfoSymbol,
    quantityWithCommission,
    precision
  );

  console.info("📈 market buy executed quantity", quantity);

  const avgMarketBuyPrice = calculateAvgMarketBuyPrice(marketOrder.fills);

  const slOriginalPrice =
    (avgMarketBuyPrice * (100 - tradeConfig.stopLossPercentage)) / 100;
  const stopLossStopPrice = computePrice(
    avgMarketBuyPrice,
    slOriginalPrice,
    exchangeInfoSymbol
  );

  const tpOriginalPrice =
    (avgMarketBuyPrice * (100 + tradeConfig.takeProfitPercentage)) / 100;
  const takeProfitStopPrice = computePrice(
    avgMarketBuyPrice,
    tpOriginalPrice,
    exchangeInfoSymbol
  );

  const newOCOOrderRequest: NewOCOOrderRequest = {
    symbol: exchangeInfoSymbol.symbol,
    quantity,
    takeProfitPrice: takeProfitStopPrice,
    stopLossPrice: stopLossStopPrice,
    timeInForce: "GTC",
  };

  console.info("📈 stop loss take profit request", newOCOOrderRequest);

  const ocoOrder = await newOCOOrder(newOCOOrderRequest);
  startStrategy(
    exchangeInfoSymbol.symbol,
    exchangeInfoSymbol,
    newOCOOrderRequest,
    ocoOrder.orderListId,
    newsId
  );

  return ocoOrder;
};
