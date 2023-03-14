import axios from "axios";
import { extractSymbolsFromTitle, removeBannedSymbols } from "./symbols";
import { FeedItem } from "icrypto-trade-models/feed";
import { DataBaseClient } from "../connections/database";
import { TradeConfig } from "icrypto-trade-models/transactions";

let bannedTokens: { symbol: string }[] = [];

export const getFeed = async (option?: {
  limit?: number;
  guess?: boolean;
}): Promise<FeedItem[]> => {
  const response = await axios
    .get(`https://news.treeofalpha.com/api/news?limit=${option?.limit || 100}`)
    .then((res) => res.data)
    .then((feed) => (!option?.guess ? feed : addSymbolsGuessToFeed(feed)))
    .catch((err) => {
      console.log(err);
      return [];
    });
  return response;
};

export const getFeedItem = async (id: string): Promise<FeedItem> => {
  const response = await axios
    .get(`https://news.treeofalpha.com/api/news?id=${id}`)
    .then((res) => res.data)
    .catch((err) => {
      console.log(err);
      return {};
    });
  return response;
};

export const filterGoodFeed = (
  feed: FeedItem[],
  tradeConfig: TradeConfig
): FeedItem[] => {
  return feed.filter(
    (item) =>
      item.likes >= tradeConfig.nLikes &&
      item.likes > item.dislikes &&
      item.time > Date.now() - tradeConfig.nMinutes * 60 * 1000
  );
};

export const addSymbolsGuessToFeed = async (
  feed: FeedItem[]
): Promise<FeedItem[]> => {
  if (!bannedTokens.length)
    bannedTokens = await DataBaseClient.Token.getBannedTokens();
  return feed.map((item) => {
    const symbolsGuess = extractSymbolsFromTitle(item.title);
    item.symbolsGuess = removeBannedSymbols(symbolsGuess, bannedTokens);
    item.matchFound = false;
    if (item.symbols && item.symbols.length) {
      item.symbols = [...new Set(item.symbols)];
      item.matchFound = item.symbolsGuess.some((symbol) =>
        item.symbols.includes(symbol.toUpperCase())
      );
    }
    return item;
  });
};
