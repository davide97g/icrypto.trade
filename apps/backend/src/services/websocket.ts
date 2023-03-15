import { DataBaseClient } from "../connections/database";
import WebSocket from "ws";
import { wsConnect } from "../connections/websocket";
import { BinanceTicker } from "../models/binance";
import { FeedItem, News } from "../models/feed";
import { Order } from "../models/orders";
import {
  ExchangeInfoSymbol,
  NewOCOOrderRequest,
  NewOrderRequest,
  TradeConfig,
} from "../models/transactions";
import { WsNTALikeMessage, WsNTANewsMessage } from "../models/websocket";
import { roundToNDigits } from "../utils/utils";
import { getFeed, getFeedItem } from "./feed";
import {
  sendErrorMail,
  sendNewPotentialOrderMail,
  sendOrderMail,
} from "./mail";
import { newOrder, newOCOOrder } from "./orders";
import {
  extractSymbolsFromTitle,
  getAvailableSymbolsOnBinance,
  getTickersPrice,
  removeBannedSymbols,
} from "./symbols";
import { getTradesByOrderId, subscribeSymbolTrade } from "./transactions";
import { telegramApi } from "../config/telegram";

interface WsFeedItem {
  _id: string;
  title: string;
  likes: number;
  dislikes: number;
  time: number;
}
interface WsNTAFeed {
  [key: string]: WsFeedItem;
}

interface BannedToken {
  symbol: string;
}

const FEED: WsNTAFeed = {};

let bannedTokens: { symbol: string }[] = [];

const WS: {
  news?: WebSocket;
  likes?: WebSocket;
  startTime?: number;
  isRunning: boolean;
} = {
  isRunning: false,
};

export const getWS = () => ({
  startTime: WS.startTime,
  isRunning: WS.isRunning,
});

export const startWebSockets = async () => {
  const resNews = await StartNewsWebSocket();
  const resLikes = await StartLikesWebSocket();
  const message = `${resNews.message} - ${resLikes.message}`;
  WS.startTime = Date.now();
  WS.isRunning = true;
  return { message };
};

export const stopWebSockets = () => {
  const resNews = StopNewsWebSocket();
  const resLikes = StopLikesWebSocket();
  const message = `${resNews.message} - ${resLikes.message}`;
  WS.startTime = undefined;
  WS.isRunning = false;
  return { message };
};

export const getWsFeed = (): WsNTAFeed => FEED;

const StartNewsWebSocket = async () => {
  if (WS.news) return { message: "WS News already connected" };
  const feed = await getFeed();
  feed.forEach((item) => {
    FEED[item._id] = {
      _id: item._id,
      title: item.title,
      likes: item.likes,
      dislikes: item.dislikes,
      time: item.time,
    };
  });

  const WsNewsURL = "wss://news.treeofalpha.com/ws";
  WS.news = wsConnect<WsNTANewsMessage>(WsNewsURL, (data) => {
    FEED[data._id] = {
      _id: data._id,
      title: data.title,
      likes: 0,
      dislikes: 0,
      time: data.time,
    };
    console.log("[News]", data._id);
  });
  return { message: "WS News connected" };
};

const StartLikesWebSocket = async () => {
  if (WS.likes) return { message: "WS Likes already connected" };
  const config = await DataBaseClient.Scheduler.getTradeConfig();
  if (!config) throw new Error("Trade config not found");
  if (!bannedTokens.length)
    bannedTokens = await DataBaseClient.Token.getBannedTokens();
  const WsNewsURL = "wss://news.treeofalpha.com/ws/likes";
  WS.likes = wsConnect<WsNTALikeMessage>(WsNewsURL, (data) => {
    if (FEED[data.newsId]) {
      FEED[data.newsId].dislikes = data.dislikes;
      FEED[data.newsId].likes = data.likes;
      console.log(
        "[Feedback]",
        data.newsId,
        "👍",
        data.likes,
        "👎",
        data.dislikes
      );
      if (isGood(FEED[data.newsId], config))
        analyzeFeedItem(FEED[data.newsId], config, bannedTokens);
    } else console.warn("News not found in FEED", data.newsId);
  });
  return { message: "WS Likes connected" };
};

const StopNewsWebSocket = () => {
  if (!WS.news) return { message: "WS News already disconnected" };
  WS.news.close();
  WS.news = undefined;
  return { message: "WS News disconnected" };
};

const StopLikesWebSocket = () => {
  if (!WS.likes) return { message: "WS Likes already disconnected" };
  WS.likes.close();
  WS.likes = undefined;
  return { message: "WS Likes disconnected" };
};

const isGood = (item: WsFeedItem, tradeConfig: TradeConfig): boolean => {
  return (
    item.likes >= tradeConfig.nLikes &&
    item.likes > item.dislikes &&
    item.time > Date.now() - tradeConfig.nMinutes * 60 * 1000
  );
};

const analyzeFeedItem = async (
  item: WsFeedItem,
  tradeConfig: TradeConfig,
  bannedTokens: BannedToken[]
) => {
  const news = await DataBaseClient.News.getById(item._id);
  if (news) {
    console.log("News already analyzed", item._id);
    return;
  }
  const feedItem = await getFeedItem(item._id);
  const feedWithGuess = await addSymbolsGuessToFeedItem(feedItem, bannedTokens);
  if (!feedWithGuess.symbolsGuess.length) {
    const news: News = {
      ...feedWithGuess,
      status: "missing",
    };
    await DataBaseClient.News.updateById(item._id, news); //  created for the first time with "potential" status
    await sendNewPotentialOrderMail(news);
  }
  const availableSymbols = await getAvailableSymbolsOnBinance(
    feedWithGuess.symbolsGuess
  );
  if (!availableSymbols.length) {
    const news: News = {
      ...feedWithGuess,
      status: "unavailable",
    };
    await DataBaseClient.News.updateById(item._id, news); //  created for the first time with "potential" status
    await sendNewPotentialOrderMail(news);
  } else {
    // * THERE ARE AVAILABLE SYMBOLS
    const news: News = {
      ...feedWithGuess,
      status: "pending",
    };
    await DataBaseClient.News.updateById(item._id, news); //  created for the first time with "pending" status
    try {
      // ? get current price of the symbols
      const tickersPrice = await getTickersPrice(
        availableSymbols.map((s) => s.symbol)
      );
      // ? here I start to execute orders for each of the guessed symbols
      // ? 1 MARKET BUY ORDER + 1 OCO (SL / TP) ORDER
      const INTERVAL_MS = 1000;
      let i = 0;
      const interval = setInterval(() => {
        const symbol = availableSymbols[i];
        trade(item._id, symbol, tradeConfig, tickersPrice);
        i++;
        if (i === availableSymbols.length) clearInterval(interval);
      }, INTERVAL_MS);
    } catch (err) {
      console.error(err);
      sendErrorMail(
        "[Error Analyzing Feed Item]",
        "Error analyzing feed item",
        err
      );
    }
  }
};

const addSymbolsGuessToFeedItem = async (
  item: FeedItem,
  bannedTokens: BannedToken[]
): Promise<FeedItem> => {
  const symbolsGuess = extractSymbolsFromTitle(item.title);
  item.symbolsGuess = removeBannedSymbols(symbolsGuess, bannedTokens);
  if (item.symbols && item.symbols.length)
    item.symbols = [...new Set(item.symbols)];
  return item;
};

const trade = async (
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
      marketOrderTransaction.symbol,
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
  } catch (e: any) {
    console.error("[Error MARKET Order]", e);
    await DataBaseClient.News.updateStatus(newsId, "market-error");
    await sendErrorMail(
      `Error MARKET Order [${exchangeInfoSymbol.symbol}]`,
      `There was an error with MARKET ORDER for the news ${newsId}`,
      e
    );
  }
};

const newMarketOrder = async (
  exchangeInfoSymbol: ExchangeInfoSymbol,
  tradeConfig: TradeConfig,
  tickerPrices: BinanceTicker[]
) => {
  console.info("New order", exchangeInfoSymbol.symbol);
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
  const quantity = computeQuantity(exchangeInfoSymbol, orderQty, precision);
  const newOrderRequest: NewOrderRequest = {
    symbol: exchangeInfoSymbol.symbol,
    side: "BUY",
    type: "MARKET",
    quantity,
    precision,
    timeInForce: "GTC",
  };
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
  const totQty = marketOrderTransaction.fills.reduce(
    (acc, fill) => acc + parseFloat(fill.qty),
    0
  );
  const avgMarketBuyPrice =
    marketOrderTransaction.fills.reduce(
      (acc, fill) => acc + parseFloat(fill.price) * parseFloat(fill.qty),
      0
    ) / totQty;

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

  const newOCOOrderRequest: NewOCOOrderRequest = {
    symbol: exchangeInfoSymbol.symbol,
    quantity,
    timeInForce: "GTC",
    stopLossPrice: stopLossStopPrice,
    takeProfitPrice: takeProfitStopPrice,
    marketBuyOrderId: marketOrderTransaction.orderId,
  };
  console.info("📈 stop loss take profit request", newOCOOrderRequest);
  return newOCOOrder(newOCOOrderRequest);
};

const computeQuantity = (
  exchangeInfoSymbol: ExchangeInfoSymbol,
  orderQty: number,
  precision: number
) => {
  const filterLotSize = exchangeInfoSymbol.filters.find(
    (f) => f.filterType === "LOT_SIZE"
  );
  if (!filterLotSize) throw new Error("Lot size filter not found");
  const maxLotSizeQty = parseFloat(filterLotSize?.maxQty || "0");
  const minLotSizeQty = parseFloat(filterLotSize?.minQty || "0");
  const stepSizeValue = parseFloat(filterLotSize?.stepSize || "0.10000000");
  const stepSize = (filterLotSize?.stepSize || "0.10000000").replace(".", "");
  const stepSizePrecision =
    stepSize.indexOf("1") > -1 ? stepSize.indexOf("1") : precision;

  const filterMinNotional = exchangeInfoSymbol.filters.find(
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
