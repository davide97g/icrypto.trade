import { BinanceClient } from "../config/binance";
import { BinanceError, BinanceTicker } from "icrypto-trade-models/binance";
import { Kline, KlineInterval } from "icrypto-trade-models/transactions";
import {
  stopWords,
  specialCharacters,
  customStopWords,
} from "../utils/stopwords";
import { tokens as TOKENS } from "../utils/tokens";

const tokens = TOKENS.filter(
  (token) =>
    token.name.toUpperCase() !== "binance" &&
    token.name.toUpperCase() !== "dao" &&
    // token.name.toUpperCase() !== "bnb" &&
    token.name.toUpperCase() !== "coin"
)
  .map((token) => ({
    ...token,
    name: token.name
      .toUpperCase()
      .replace("token", "")
      .replace("coin", "")
      .replace("bnb", "")
      .replace("binance", "")
      .replace("dao", "")
      .replace("nft", "")
      .trim(),
  }))
  .filter((token) => token.name.length > 2);

export const getCleanTokens = () => tokens;

export const cleanWords = (text: string) => {
  // remove links from text
  const noLinksText = text.replace(/(?:https?|ftp):\/\/[\n\S]+/g, "");

  const words = noLinksText.split(" ");
  const filteredWords = words
    .filter((word) => !stopWords.includes(word))
    .filter((word) => !customStopWords.includes(word))
    .filter((word) => !specialCharacters.includes(word))
    .map((word) => word.toUpperCase())
    .map((word) => word.split("_"))
    .flat()
    .map((word) => word.split("/"))
    .flat()
    .map((word) => word.replace(/[^a-zA-Z ]/g, ""))
    .filter((word) => word.length > 2);
  return filteredWords;
};

export const extractSymbolsFromTitle = (title: string) => {
  const words = cleanWords(title); // trovo le singole parole
  const matches: string[] = [];

  tokens.forEach((token) => {
    // per ogni token a disposizione
    const tokenNameUpperCase = token.name.toUpperCase(); // nome del token in minuscolo
    const symbolUpperCase = token.symbol.toUpperCase(); // simbolo del token in minuscolo

    if (
      words.includes(tokenNameUpperCase) ||
      words.includes(tokenNameUpperCase + "s") ||
      words.includes(symbolUpperCase)
    )
      matches.push(token.symbol);
  });

  // keep only unique matches
  return [...new Set(matches)]
    .filter((s) => !["USDT", "BUSD"].includes(s))
    .map((s) => s + "USDT");
};

export const removeBannedSymbols = (
  symbols: string[],
  bannedTokens: { symbol: string }[]
) => {
  const bannedSymbols = bannedTokens.map(
    (token) => token.symbol.toUpperCase() + "USDT"
  );
  return symbols.filter(
    (symbol) => !bannedSymbols.includes(symbol.toUpperCase())
  );
};

export const getKlines = async (
  symbol: string,
  interval: KlineInterval,
  limit: number,
  startTime?: number,
  endTime?: number
): Promise<Kline[]> => {
  const klines = await BinanceClient.klines(symbol, interval, {
    startTime,
    endTime,
    limit,
  })
    .then((res: any) => res.data)
    .then(
      (data: []) =>
        data.map((kline) => ({
          openTime: kline[0],
          open: kline[1],
          high: kline[2],
          low: kline[3],
          close: kline[4],
          volume: kline[5],
          closeTime: kline[6],
          quoteAssetVolume: kline[7],
          numberOfTrades: kline[8],
          takerBuyBaseAssetVolume: kline[9],
          takerBuyQuoteAssetVolume: kline[10],
          ignore: kline[11],
        })) as Kline[]
    )
    .catch((err: any) => {
      console.error(err);
      return err;
    });
  return klines;
};

export const getAverageMove24h = async (symbol: string, limit: number) => {
  const time = Date.now();
  try {
    const klines = await getKlines(
      symbol,
      "1m",
      limit,
      time - 24 * 60 * 60 * 1000,
      time
    );
    const averageMove = klines.reduce((acc, kline) => {
      const open = parseFloat(kline.open);
      const close = parseFloat(kline.close);
      const move = (close - open) / open;
      return acc + move;
    }, 0);
    return averageMove / klines.length;
  } catch (err) {
    console.error(err);
    return 0;
  }
};

export const getTickerPrice = async (
  symbol: string
): Promise<BinanceTicker> => {
  return BinanceClient.tickerPrice(symbol)
    .then((response: any) => response.data as BinanceTicker)
    .catch((err: BinanceError) => {
      console.error(err.response.data);
      throw err.response.data;
    });
};
