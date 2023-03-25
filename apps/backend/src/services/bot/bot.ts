import { DataBaseClient } from "../../connections/database";
import WebSocket from "ws";
import { wsConnect } from "../../connections/websocket";
import { WsNTALikeMessage, WsNTANewsMessage } from "../../models/websocket";
import { getFeed, getFeedItem } from "../feed";
import { sendErrorMail, sendNewPotentialOrderMail } from "../mail";
import {
  extractSymbolsFromTitle,
  getAvailableSymbolsOnBinance,
  getTickersPrice,
  removeBannedSymbols,
} from "../symbols";
import { trade } from "./trade";
import { TradeConfig } from "../../models/bot";
import { GoodFeedItem } from "../../models/database";
import { FeedItem } from "../../models/feed";

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

let bannedSymbols: { symbol: string }[] = [];

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
  if (WS.interval) clearInterval(WS.interval);
  const interval = setInterval(() => {
    if (WS.news) {
      console.info("Ping News WS");
      WS.news.ping();
    }
    if (WS.likes) {
      console.info("Ping Likes WS");
      WS.likes.ping();
    }
    if (!WS.news && !WS.likes) clearInterval(interval);
  }, 30000);
  return interval;
};

const StartNewsWebSocket = async () => {
  if (WS.news) return { message: "WSGoodFeedItemalready connected" };
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
      console.log("[GoodFeedItem]", data._id);
    },
    StartNewsWebSocket
  );
  return { message: "WSGoodFeedItemconnected" };
};

const StartLikesWebSocket = async () => {
  if (WS.likes) return { message: "WS Likes already connected" };
  const config = await DataBaseClient.Bot.getTradeConfig();
  if (!config) throw new Error("Trade config not found");
  WS.tradeConfig = config;
  if (!bannedSymbols.length)
    bannedSymbols = await DataBaseClient.Symbols.getBanned();
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
            analyzeFeedItem(FEED[data.newsId], config, bannedSymbols);
        }
      }
    },
    StartLikesWebSocket
  );
  return { message: "WS Likes connected" };
};

const StopNewsWebSocket = () => {
  if (!WS.news) return { message: "WSGoodFeedItemalready disconnected" };
  WS.news.close();
  WS.news = undefined;
  return { message: "WSGoodFeedItemdisconnected" };
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
  bannedSymbols: BannedToken[]
) => {
  const news = await DataBaseClient.GoodFeedItem.getById(item._id);
  if (news) {
    console.log("GoodFeedItem already analyzed", item._id);
    return;
  }
  const feedItem = await getFeedItem(item._id);
  const feedWithGuess = await addSymbolsGuessToFeedItem(
    feedItem,
    bannedSymbols
  );
  if (!feedWithGuess.symbolsGuess.length) {
    const news: GoodFeedItem = {
      ...feedWithGuess,
      status: "missing",
    };
    await DataBaseClient.GoodFeedItem.updateById(item._id, news); //  created for the first time with "potential" status
    await sendNewPotentialOrderMail(news);
  } else {
    const availableSymbols = await getAvailableSymbolsOnBinance(
      feedWithGuess.symbolsGuess
    );
    if (!availableSymbols.length) {
      const news: GoodFeedItem = {
        ...feedWithGuess,
        status: "unavailable",
      };
      await DataBaseClient.GoodFeedItem.updateById(item._id, news); //  created for the first time with "potential" status
      await sendNewPotentialOrderMail(news);
    } else {
      // * THERE ARE AVAILABLE SYMBOLS
      const news: GoodFeedItem = {
        ...feedWithGuess,
        status: "pending",
      };
      await DataBaseClient.GoodFeedItem.updateById(item._id, news); //  created for the first time with "pending" status
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
  bannedSymbols: BannedToken[]
): Promise<FeedItem> => {
  const symbolsGuess = extractSymbolsFromTitle(item.title);
  item.symbolsGuess = removeBannedSymbols(symbolsGuess, bannedSymbols);
  if (item.symbols && item.symbols.length)
    item.symbols = [...new Set(item.symbols)];
  return item;
};

startWebSockets();
