import { DataBaseClient } from "../connections/database";
import { wsConnect } from "../connections/websocket";
import { FeedItem } from "../models/feed";
import { TradeConfig } from "../models/transactions";
import { WsNTALikeMessage, WsNTANewsMessage } from "../models/websocket";
import { getFeed, getFeedItem } from "./feed";
import { extractSymbolsFromTitle, removeBannedSymbols } from "./symbols";

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

const FEED: WsNTAFeed = {};

let bannedTokens: { symbol: string }[] = [];

const StartNewsWebSocket = async () => {
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
  wsConnect<WsNTANewsMessage>(WsNewsURL, (data) => {
    FEED[data._id] = {
      _id: data._id,
      title: data.title,
      likes: 0,
      dislikes: 0,
      time: data.time,
    };
    console.log("[News]", data._id);
  });
};

const StartLikesWebSocket = async () => {
  const config = await DataBaseClient.Scheduler.getTradeConfig();
  if (!config) throw new Error("Trade config not found");
  const WsNewsURL = "wss://news.treeofalpha.com/ws/likes";
  wsConnect<WsNTALikeMessage>(WsNewsURL, (data) => {
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
        analyzeFeedItem(FEED[data.newsId], config);
    } else console.warn("News not found in FEED", data.newsId);
  });
};

StartNewsWebSocket();
StartLikesWebSocket();

const isGood = (item: WsFeedItem, tradeConfig: TradeConfig): boolean => {
  return (
    item.likes >= tradeConfig.nLikes &&
    item.likes > item.dislikes &&
    item.time > Date.now() - tradeConfig.nMinutes * 60 * 1000
  );
};

const analyzeFeedItem = async (item: WsFeedItem, tradeConfig: TradeConfig) => {
  const feedItem = await getFeedItem(item._id);
  const feedWithGuess = await addSymbolsGuessToFeed(feedItem);
  if (!feedWithGuess.symbolsGuess.length) {
    // TODO: send prospect order by mail
  } else {
    feedWithGuess.symbolsGuess.forEach((symbol) => {
      newOrder(symbol, tradeConfig).then(() => {
        console.info("Order placed");
      });
    });
  }
};

const addSymbolsGuessToFeed = async (item: FeedItem): Promise<FeedItem> => {
  if (!bannedTokens.length)
    bannedTokens = await DataBaseClient.Token.getBannedTokens();
  const symbolsGuess = extractSymbolsFromTitle(item.title);
  item.symbolsGuess = removeBannedSymbols(symbolsGuess, bannedTokens);
  if (item.symbols && item.symbols.length)
    item.symbols = [...new Set(item.symbols)];
  return item;
};

const newOrder = async (symbol: string, tradeConfig: TradeConfig) => {
  console.info("New order", symbol, tradeConfig);
};

export const getWsFeed = (): WsNTAFeed => FEED;
