import { WebSocket } from "ws";
import { BinanceClient } from "../config/binance";
import { BinanceTicker } from "../models/binance";
import { Order } from "../models/orders";
import {
  ExchangeInfoSymbol,
  ExchangeInfoSymbolFilter,
  Fill,
  NewOrderRequest,
  OrderSide,
  OrderTimeInForce,
  OrderType,
  TradeConfig,
} from "../models/transactions";
import { roundToNDigits } from "../utils/utils";
import { sendErrorMail, sendOrderMail } from "./mail";
import { newOrder, newOCOOrder } from "./orders";
import { getTradesByOrderId, subscribeSymbolTrade } from "./transactions";
import { telegramApi } from "../connections/telegram";
import { DataBaseClient } from "../connections/database";

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
  telegramApi.sendMessageToAdmins(
    `Trade ${newsId} ${exchangeInfoSymbol.symbol}`
  );
  try {
    const marketOrderTransaction = await newMarketOrder(
      exchangeInfoSymbol,
      tradeConfig,
      tickersPrice
    );
    const trades = await getTradesByOrderId(
      exchangeInfoSymbol.symbol,
      String(marketOrderTransaction.orderId)
    );
    await DataBaseClient.Trade.insertMany(trades);
    try {
      const ocoOrder = await newTPSLOrder(
        exchangeInfoSymbol,
        tradeConfig,
        marketOrderTransaction
      );
      const orderIds = ocoOrder.orders.map((o) => String(o.orderId));
      subscribeSymbolTrade(exchangeInfoSymbol.symbol, orderIds);
      await DataBaseClient.News.updateStatus(newsId, "success");
      await sendOrderMail(marketOrderTransaction, {
        order: ocoOrder,
      });
    } catch (e: any) {
      console.error("[Error OCO Order]", e);
      await DataBaseClient.News.updateStatus(newsId, "oco-error");
      await sendOrderMail(marketOrderTransaction, {
        error: e,
      });
    }
  } catch (error) {
    console.error("[Error MARKET Order]", error);
    await DataBaseClient.News.updateStatus(newsId, "market-error");
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

  const newOrderRequest = createNewOrderRequest(
    exchangeInfoSymbol.symbol,
    quantity,
    precision
  );

  return newOrder(newOrderRequest);
};

const newTPSLOrder = async (
  exchangeInfoSymbol: ExchangeInfoSymbol,
  tradeConfig: TradeConfig,
  marketOrderTransaction: Order
) => {
  console.info("New OCO order", exchangeInfoSymbol.symbol);

  const precision = exchangeInfoSymbol.baseAssetPrecision || 8;
  const quantityWithCommission = marketOrderTransaction.fills.reduce(
    (acc, fill) => acc + parseFloat(fill.qty) - parseFloat(fill.commission),
    0
  );
  const quantity = computeQuantity(
    exchangeInfoSymbol,
    quantityWithCommission,
    precision
  );

  console.info("📈 market buy executed quantity", quantity);

  const avgMarketBuyPrice = calculateAvgMarketBuyPrice(
    marketOrderTransaction.fills
  );

  const slOriginalPrice =
    (avgMarketBuyPrice * (100 - tradeConfig.stopLossPercentage)) / 100;
  const stopLossStopPrice = computePrice(
    avgMarketBuyPrice,
    slOriginalPrice,
    exchangeInfoSymbol,
    precision
  );

  const tpOriginalPrice =
    (avgMarketBuyPrice * (100 + tradeConfig.takeProfitPercentage)) / 100;
  const takeProfitStopPrice = computePrice(
    avgMarketBuyPrice,
    tpOriginalPrice,
    exchangeInfoSymbol,
    precision
  );

  const newOCOOrderRequest = createNewOCOOrderRequest(
    exchangeInfoSymbol.symbol,
    quantity,
    stopLossStopPrice,
    takeProfitStopPrice,
    marketOrderTransaction.orderId
  );

  console.info("📈 stop loss take profit request", newOCOOrderRequest);

  return newOCOOrder(newOCOOrderRequest);
};

// *** CREATE ORDER REQUESTS ***

const createNewOrderRequest = (
  symbol: string,
  quantity: number,
  precision: number,
  side: OrderSide = "BUY",
  type: OrderType = "MARKET",
  timeInForce: OrderTimeInForce = "GTC"
): NewOrderRequest => {
  return {
    symbol,
    side,
    type,
    quantity,
    precision,
    timeInForce,
  } as NewOrderRequest;
};

const createNewOCOOrderRequest = (
  symbol: string,
  quantity: number,
  stopLossPrice: number,
  takeProfitPrice: number,
  marketBuyOrderId: number,
  timeInForce: OrderTimeInForce = "GTC"
) => {
  return {
    symbol,
    quantity,
    timeInForce,
    stopLossPrice,
    takeProfitPrice,
    marketBuyOrderId,
  };
};

// *** UTILITY FUNCTIONS ***

const findTickerPrice = (symbol: string, tickerPrices: BinanceTicker[]) => {
  return tickerPrices.find((tickerPrice) => tickerPrice?.symbol === symbol);
};

const calculateOrderQuantity = (
  tradeAmount: number,
  tickerPrice: number,
  precision: number
) => {
  return roundToNDigits(tradeAmount / tickerPrice, precision - 1);
};

const calculateAvgMarketBuyPrice = (fills: Fill[]) => {
  const totalQty = fills.reduce((acc, fill) => acc + parseFloat(fill.qty), 0);
  const totalPrice = fills.reduce(
    (acc, fill) => acc + parseFloat(fill.price) * parseFloat(fill.qty),
    0
  );

  return totalPrice / totalQty;
};

const findFilterByType = (
  filters: ExchangeInfoSymbolFilter[],
  filterType: string
) => {
  return filters.find((f) => f.filterType === filterType)!;
};

const getPrecision = (sizeString: string, precision: number) => {
  return sizeString.indexOf("1") > -1
    ? sizeString.replace(".", "").indexOf("1")
    : precision;
};

const runQuantityCheck = (
  quantity: number,
  minLotSizeQty: number,
  maxLotSizeQty: number,
  stepSizeValue: number
): boolean => {
  return (
    quantity >= minLotSizeQty &&
    quantity <= maxLotSizeQty &&
    quantity % stepSizeValue == 0
  );
};

const computeQuantity = (
  exchangeInfoSymbol: ExchangeInfoSymbol,
  orderQty: number,
  precision: number
) => {
  const filterLotSize = findFilterByType(
    exchangeInfoSymbol.filters,
    "LOT_SIZE"
  );
  if (!filterLotSize) throw new Error("Lot size filter not found");

  const { maxQty, minQty, stepSize } = filterLotSize;
  const maxLotSizeQty = parseFloat(maxQty || "0");
  const minLotSizeQty = parseFloat(minQty || "0");
  const stepSizeValue = parseFloat(stepSize || "0.10000000");
  const stepSizePrecision = getPrecision(stepSize || "0.10000000", precision);

  console.info("stepSizePrecision", stepSizePrecision);

  const filterMinNotional = findFilterByType(
    exchangeInfoSymbol.filters,
    "MIN_NOTIONAL"
  );
  const minNotional = parseFloat(
    filterMinNotional?.minNotional || "10.00000000"
  );

  const safeQty = orderQty - stepSizeValue;
  const minimumQuantity = Math.max(safeQty, minNotional, minLotSizeQty);
  const quantity = roundToNDigits(
    Math.min(minimumQuantity, maxLotSizeQty),
    stepSizePrecision
  );

  console.info("📈 quantity", quantity);

  // const isQuantityOk = runQuantityCheck(
  //   quantity,
  //   minLotSizeQty,
  //   maxLotSizeQty,
  //   stepSizeValue
  // );
  // if (!isQuantityOk) {
  //   throw {
  //     message: "Quantity is not ok",
  //     quantity,
  //     filterLotSize,
  //   };
  // }

  return quantity;
};

const computePrice = (
  avgPrice: number,
  orderPrice: number,
  exchangeInfoSymbol: ExchangeInfoSymbol,
  precision: number
) => {
  const filterPercentPriceBySide = findFilterByType(
    exchangeInfoSymbol.filters,
    "PERCENT_PRICE_BY_SIDE"
  );
  const { askMultiplierUp, askMultiplierDown } = filterPercentPriceBySide;
  const multiplierUp = parseFloat(askMultiplierUp || "5");
  const multiplierDown = parseFloat(askMultiplierDown || "0.2");

  const downLimitPrice = avgPrice * multiplierDown;
  const upLimitPrice = avgPrice * multiplierUp;
  const price = Math.max(Math.min(orderPrice, upLimitPrice), downLimitPrice);

  const filterPriceFilter = findFilterByType(
    exchangeInfoSymbol.filters,
    "PRICE_FILTER"
  );
  const { maxPrice, minPrice, tickSize } = filterPriceFilter;
  const maxPriceValue = parseFloat(maxPrice || "0");
  const minPriceValue = parseFloat(minPrice || "0");
  const tickSizePrecision = getPrecision(tickSize || "0.00010000", precision);

  const notRoundedPrice = Math.min(
    Math.max(price, minPriceValue),
    maxPriceValue
  );
  const finalPrice = roundToNDigits(notRoundedPrice, tickSizePrecision);

  return finalPrice;
};
