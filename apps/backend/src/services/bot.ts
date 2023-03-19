import { DataBaseClient } from "../connections/database";
import WebSocket from "ws";
import { wsConnect } from "../connections/websocket";
import { FeedItem, News } from "../models/feed";
import { TradeConfig } from "../models/transactions";
import { WsNTALikeMessage, WsNTANewsMessage } from "../models/websocket";
import { getFeed, getFeedItem } from "./feed";
import { sendErrorMail, sendNewPotentialOrderMail } from "./mail";
import {
  extractSymbolsFromTitle,
  getAvailableSymbolsOnBinance,
  getTickersPrice,
  removeBannedSymbols,
} from "./symbols";
import { trade } from "./trade";
import { trackKlines } from "./trading/strategy";

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
  interval?: any;
  isRunning: boolean;
  tradeConfig?: TradeConfig;
} = {
  isRunning: false,
};

export const getWS = () => ({
  startTime: WS.startTime,
  isRunning: WS.isRunning,
  tradeConfig: WS.tradeConfig,
});

// trackKlines("BTCUSDT", "1m");

export const startWebSockets = async () => {
  const resNews = await StartNewsWebSocket();
  const resLikes = await StartLikesWebSocket();
  const message = `${resNews.message} - ${resLikes.message}`;
  WS.startTime = Date.now();
  WS.isRunning = true;
  WS.interval = pingWS();

  return { message };
};

export const stopWebSockets = () => {
  const resNews = StopNewsWebSocket();
  const resLikes = StopLikesWebSocket();
  const message = `${resNews.message} - ${resLikes.message}`;
  WS.startTime = undefined;
  WS.isRunning = false;
  clearInterval(WS.interval);
  return { message };
};

const pingWS = () => {
  const interval = setInterval(() => {
    if (WS.news) WS.news.ping();
    if (WS.likes) WS.likes.ping();
    if (!WS.news && !WS.likes) clearInterval(interval);
  }, 10000);
  return interval;
};

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
  WS.news = wsConnect<WsNTANewsMessage>(
    WsNewsURL,
    (data) => {
      FEED[data._id] = {
        _id: data._id,
        title: data.title,
        likes: 0,
        dislikes: 0,
        time: data.time,
      };
      console.log("[News]", data._id);
    },
    StartNewsWebSocket
  );
  return { message: "WS News connected" };
};

const StartLikesWebSocket = async () => {
  if (WS.likes) return { message: "WS Likes already connected" };
  const config = await DataBaseClient.Scheduler.getTradeConfig();
  if (!config) throw new Error("Trade config not found");
  WS.tradeConfig = config;
  if (!bannedTokens.length)
    bannedTokens = await DataBaseClient.Token.getBannedTokens();
  const WsNewsURL = "wss://news.treeofalpha.com/ws/likes";
  WS.likes = wsConnect<WsNTALikeMessage>(
    WsNewsURL,
    (data) => {
      if (FEED[data.newsId]) {
        const isAlreadyGood = isGood(FEED[data.newsId], config);
        if (!isAlreadyGood) {
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
        }
      }
    },
    StartLikesWebSocket
  );
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
  } else {
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
