import schedule from "node-schedule";
import { DataBaseClient } from "../connections/database";
import { BinanceError } from "icrypto-trade-models/binance";
import { FeedItem, News } from "icrypto-trade-models/feed";
import { Scheduler } from "icrypto-trade-models/scheduler";
import {
  ExchangeInfoSymbol,
  NewOrderRequest,
  StopLossTakeProfitRequest,
  TradeConfig,
  Transaction,
} from "icrypto-trade-models/transactions";
import { roundToNDigits } from "../utils/utils";
import { addSymbolsGuessToFeed, filterGoodFeed, getFeed } from "./feed";
import {
  sendErrorMail,
  sendNewOrderMail,
  sendNewPotentialOrderMail,
} from "./mail";
import { getTickerPrice } from "./symbols";
import {
  getExchangeInfo,
  getExchangeInfoSymbols,
  newStopLossTakeProfitOrder,
  newTransaction,
} from "./transactions";

const scheduler: Scheduler = {
  job: null,
  startTime: 0,
};

export const updateTradeConfig = (tradeConfig: TradeConfig) => {
  scheduler.tradeConfig = tradeConfig;
};

export const startScheduler = async (): Promise<{
  message: string;
  startTime?: number;
}> => {
  if (scheduler.job) return { message: "Scheduler already running" };

  try {
    const config = await DataBaseClient.Scheduler.getTradeConfig();
    if (!config) throw new Error("Trade config not found");
    scheduler.tradeConfig = config;
    console.info("Starting scheduler with", scheduler.tradeConfig);
    scheduler.startTime = Date.now();
    scheduler.job = schedule.scheduleJob(
      `*/${scheduler.tradeConfig.feedUpdateInterval ?? 60} * * * * *`,
      () => loop()
    );
    return { message: "Scheduler started", startTime: scheduler.startTime };
  } catch (err) {
    console.log(err);
    throw new Error("Could not get trade config");
  }
};

export const stopScheduler = () => {
  if (scheduler.job) {
    scheduler.job.cancel();
    scheduler.job = null;
    scheduler.startTime = 0;
    return { message: "Scheduler stopped" };
  }
  return { message: "Scheduler not running" };
};

export const getSchedulerStatus = () => {
  return {
    running: !!scheduler.job,
    startTime: scheduler.startTime,
  };
};

const loop = async () => {
  const tradeConfig = scheduler.tradeConfig;
  if (!tradeConfig) throw new Error("Trade config not found");

  console.group("main loop");
  // get the feed from news of alpha
  const feed = await getFeed({
    limit: tradeConfig.feedLimit || 100,
  });
  // add the symbols guess to the feed
  const feedWithGuess = await addSymbolsGuessToFeed(feed);
  // filter the feed to get only the good feed items
  const goodFeed = filterGoodFeed(feedWithGuess, tradeConfig);
  // analyze the good feed items
  if (goodFeed.length) await analyzeGoodFeed(goodFeed, tradeConfig);
  console.groupEnd();
};

// only good feed items are passed to this function
export const analyzeGoodFeed = async (
  feed: FeedItem[],
  tradeConfig: TradeConfig
) => {
  console.info(`📰 ${feed.length} good feed items found`);

  const lastAllowedTime = Date.now() - tradeConfig.nMinutes * 60 * 1000;
  const allNews = await DataBaseClient.News.get();

  const oldNews = allNews.filter((item) => item.time < lastAllowedTime);
  if (oldNews.length) {
    console.info(`📰 ${oldNews.length} old news found:`);
    await DataBaseClient.News.delete(oldNews)
      .then(() => console.info("\tDeleted"))
      .catch(() => console.error("\tCould not delete old news"));
  }
  const savedNews = allNews.filter((item) => item.time >= lastAllowedTime);

  // ? get the news that are new
  const newNews = feed.filter(
    (item) => !savedNews.find((news) => news._id === item._id)
  );

  if (!newNews.length) {
    console.info("👌🏻 no new news to analyze");
    return;
  }

  console.info(`📰 ${newNews.length} new news to analyze`);

  // check the symbols, if they are available to trade
  const symbolsAvailable = await getExchangeInfo().then((info) =>
    info.symbols.filter((s) => s.quoteAsset === "USDT")
  );

  const newsFromOrders = await Promise.all(
    newNews.map((item) => newOrder(item, symbolsAvailable, tradeConfig))
  ).catch((err) => {
    console.error(err);
    return [];
  });

  const newsToSave = newsFromOrders.flat().filter((item) => !!item) as News[];
  if (!newsToSave.length) {
    console.info("👌🏻 no news to save");
    return;
  }

  await DataBaseClient.News.update(newsToSave)
    .then(() => console.info(`👌🏻 update done of ${newsToSave.length} news`))
    .catch((err) => {
      console.error(err);
    });
  return newsToSave;
};

const newOrder = async (
  item: FeedItem,
  exchangeInfoSymbols: ExchangeInfoSymbol[],
  tradeConfig: TradeConfig
): Promise<(News | null)[]> => {
  if (!item.symbolsGuess.length) {
    console.info("👎🏻 no symbols found for", item._id);
    const news: News = { ...item, orderStatus: "prospect" };
    await sendNewPotentialOrderMail(news);
    return [news];
  }
  const availableExchangeInfoSymbols = item.symbolsGuess
    .map((symbol) => {
      const exchangeInfoSymbol = exchangeInfoSymbols.find(
        (s) => s.symbol === symbol
      );
      return exchangeInfoSymbol;
    })
    .filter((s) => !!s) as ExchangeInfoSymbol[];

  const updatedAvailableExchangeInfoSymbols = await getExchangeInfoSymbols(
    availableExchangeInfoSymbols.map((s) => s.symbol)
  ).then((res) => res.filter((s) => s.quoteAsset === "USDT"));

  console.info(
    `📰 ${updatedAvailableExchangeInfoSymbols.length} exchange info symbols updated for ${item._id}`
  );

  const requests = await createOrderRequests(
    updatedAvailableExchangeInfoSymbols,
    tradeConfig
  );
  if (!requests.length) {
    console.info("👎🏻 no symbols available for", item._id);
    const news: News = { ...item, orderStatus: "error" };
    return [news];
  }

  const binanceTransactions = await Promise.all(
    requests.map((request) =>
      executeOrderRequest(
        request,
        updatedAvailableExchangeInfoSymbols,
        tradeConfig
      )
    )
  ).then((res) => res.flat());

  const transactions = binanceTransactions
    .filter((bT) => !!bT?.transaction)
    .map((bT) => bT?.transaction) as Transaction[];

  const errors = binanceTransactions
    .filter((bT) => !!bT?.error)
    .map((bT) => bT?.error) as BinanceError[];

  if (errors.length)
    DataBaseClient.News.update([{ ...item, orderStatus: "error" }]);

  const updatedNews = await Promise.all(
    transactions.map((t) =>
      DataBaseClient.Transaction.add(t)
        .then((res) => {
          if (res) {
            return {
              ...item,
              orderId: t!.orderId,
            } as News;
          } else return null;
        })
        .catch((err) => {
          console.error(err);
          return null;
        })
    )
  ).then((res) => {
    console.info(
      `📰 ${res.filter((news) => !!news).length} orders created from ${
        item._id
      }`
    );
    return res;
  });

  return updatedNews;
};

const executeOrderRequest = async (
  request: NewOrderRequest,
  symbolsAvailable: ExchangeInfoSymbol[],
  tradeConfig: TradeConfig
) => {
  const symbolAvailable: ExchangeInfoSymbol = symbolsAvailable.find(
    (s) => s.symbol === request.symbol
  )!;
  console.group(`📈 ${request.symbol} order request`);
  try {
    const marketBuy = await newTransaction(request);
    if (marketBuy.transaction) {
      const quantityWithCommission = marketBuy.transaction.fills.reduce(
        (acc, fill) => acc + parseFloat(fill.qty) - parseFloat(fill.commission),
        0
      );
      const quantity = computeQuantity(
        quantityWithCommission,
        symbolAvailable,
        request.precision
      );
      console.info("📈 market buy executed quantity", quantity);
      const totQty = marketBuy.transaction.fills.reduce(
        (acc, fill) => acc + parseFloat(fill.qty),
        0
      );
      const avgMarketBuyPrice =
        marketBuy.transaction.fills.reduce(
          (acc, fill) => acc + parseFloat(fill.price) * parseFloat(fill.qty),
          0
        ) / totQty;

      const slOriginalPrice =
        (avgMarketBuyPrice * (100 - tradeConfig.stopLossPercentage)) / 100;
      const stopLossStopPrice = computePrice(
        avgMarketBuyPrice,
        slOriginalPrice,
        symbolAvailable,
        request.precision
      );

      const tpOriginalPrice =
        (avgMarketBuyPrice * (100 + tradeConfig.takeProfitPercentage)) / 100;
      const takeProfitStopPrice = computePrice(
        avgMarketBuyPrice,
        tpOriginalPrice,
        symbolAvailable,
        request.precision
      );

      const stopLossTakeProfitRequest: StopLossTakeProfitRequest = {
        symbol: request.symbol,
        quantity,
        timeInForce: "GTC",
        stopLossPrice: stopLossStopPrice,
        takeProfitPrice: takeProfitStopPrice,
        marketBuyOrderId: marketBuy.transaction.orderId,
      };
      console.info(
        "📈 stop loss take profit request",
        stopLossTakeProfitRequest
      );
      const stopLossTakeProfitResponse = await newStopLossTakeProfitOrder(
        stopLossTakeProfitRequest
      );

      await sendNewOrderMail(marketBuy.transaction, stopLossTakeProfitResponse);

      return {
        transaction: marketBuy.transaction,
        status: "success",
        error: null,
      };
    } else {
      await sendErrorMail(
        "Scheduler: Error on new order",
        `Error while trying to execute a market buy order for ${request.symbol}`,
        marketBuy.error?.response.data.msg
      );
      return {
        transaction: null,
        status: "error",
        error: marketBuy.error?.response.data.msg,
      };
    }
  } catch (err: any) {
    console.error(err);
    await sendErrorMail(
      "Scheduler: Error on new order",
      `Error while trying to execute an order for ${request.symbol}`,
      err.toString()
    );
    return {
      transaction: null,
      status: "error",
      error: err.toString(),
    };
  } finally {
    console.groupEnd();
  }
};

const createOrderRequests = async (
  availableExchangeInfoSymbols: ExchangeInfoSymbol[],
  tradeConfig: TradeConfig
): Promise<NewOrderRequest[]> => {
  const tickerPrices = await Promise.all(
    availableExchangeInfoSymbols.map((exchangeInfoSymbol) =>
      exchangeInfoSymbol?.symbol
        ? getTickerPrice(exchangeInfoSymbol?.symbol).catch(() => null)
        : null
    )
  );

  return availableExchangeInfoSymbols.map((exchangeInfoSymbol) => {
    const precision = exchangeInfoSymbol.baseAssetPrecision || 8;
    const tickerPriceObj = tickerPrices.find(
      (tickerPrice) => tickerPrice?.symbol === exchangeInfoSymbol.symbol
    );
    const tickerPrice = roundToNDigits(
      parseFloat(tickerPriceObj?.price || "0"),
      precision - 1
    );
    console.info("📈", tickerPrice, exchangeInfoSymbol.symbol);
    const orderQty = roundToNDigits(
      tradeConfig.tradeAmount / tickerPrice,
      precision - 1
    );
    const filterLotSize = exchangeInfoSymbol.filters.find(
      (f) => f.filterType === "LOT_SIZE"
    );
    if (!filterLotSize) throw new Error("Lot size filter not found");
    const maxLotSizeQty = parseFloat(filterLotSize?.maxQty || "0");
    const minLotSizeQty = parseFloat(filterLotSize?.minQty || "0");
    const stepSize = (filterLotSize?.stepSize || "0.10000000").replace(".", "");
    const stepSizePrecision =
      stepSize.indexOf("1") > -1 ? stepSize.indexOf("1") : precision;

    const filterMinNotional = exchangeInfoSymbol.filters.find(
      (f) => f.filterType === "MIN_NOTIONAL"
    );
    const minNotional = parseFloat(
      filterMinNotional?.minNotional || "10.00000000"
    );

    const minimumQuantity = Math.max(orderQty, minNotional, minLotSizeQty);

    const quantity = roundToNDigits(
      Math.min(minimumQuantity, maxLotSizeQty),
      stepSizePrecision
    );
    const NewOrderRequest: NewOrderRequest = {
      symbol: exchangeInfoSymbol.symbol,
      side: "BUY",
      type: "MARKET",
      quantity,
      precision,
      timeInForce: "GTC",
    };
    return NewOrderRequest;
  });
};

// https://binance-docs.github.io/apidocs/spot/en/#filters
const computePrice = (
  avgPrice: number,
  orderPrice: number,
  exchangeInfoSymbol: ExchangeInfoSymbol,
  precision: number
) => {
  const filterPercentPriceBySide = exchangeInfoSymbol?.filters.find(
    (f) => f.filterType === "PERCENT_PRICE_BY_SIDE"
  );
  const multiplierUp = parseFloat(
    filterPercentPriceBySide?.askMultiplierUp || "5"
  );
  const multiplierDown = parseFloat(
    filterPercentPriceBySide?.askMultiplierDown || "0.2"
  );

  const downLimitPrice = avgPrice * multiplierDown;
  const upLimitPrice = avgPrice * multiplierUp;
  const price = Math.max(Math.min(orderPrice, upLimitPrice), downLimitPrice);

  const filterPriceFilter = exchangeInfoSymbol?.filters.find(
    (f) => f.filterType === "PRICE_FILTER"
  );

  const maxPrice = parseFloat(filterPriceFilter?.maxPrice || "0");
  const minPrice = parseFloat(filterPriceFilter?.minPrice || "0");
  const tickSize = (filterPriceFilter?.tickSize || "0.00010000").replace(
    ".",
    ""
  );
  const tickSizePrecision =
    tickSize.indexOf("1") > -1 ? tickSize.indexOf("1") : precision;

  const notRoundedPrice = Math.min(Math.max(price, minPrice), maxPrice);
  const finalPrice = roundToNDigits(notRoundedPrice, tickSizePrecision);

  return finalPrice;
};

const computeQuantity = (
  orderQty: number,
  exchangeInfoSymbol: ExchangeInfoSymbol,
  precision: number
) => {
  const filterLotSize = exchangeInfoSymbol?.filters.find(
    (f) => f.filterType === "LOT_SIZE"
  );
  if (!filterLotSize) throw new Error("Lot size filter not found");
  const maxLotSizeQty = parseFloat(filterLotSize?.maxQty || "0");
  const minLotSizeQty = parseFloat(filterLotSize?.minQty || "0");
  const stepSizeValue = parseFloat(filterLotSize?.stepSize || "0.10000000");
  const stepSize = (filterLotSize?.stepSize || "0.10000000").replace(".", "");
  const stepSizePrecision =
    stepSize.indexOf("1") > -1 ? stepSize.indexOf("1") : precision;

  const filterMinNotional = exchangeInfoSymbol?.filters.find(
    (f) => f.filterType === "MIN_NOTIONAL"
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
  return quantity;
};

// if (!env.test)
//   // *** START AUTOMATICALLY SCHEDULER ***
//   startScheduler()
//     .then((res) => console.info(res))
//     .catch((err) => console.error(err));
