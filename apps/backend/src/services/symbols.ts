import { BinanceClient } from "../config/binance";
import { ExchangeInfoSymbol } from "icrypto.trade-types/account";
import { BinanceError, BinanceTicker } from "icrypto.trade-types/binance";
import {
  stopWords,
  specialCharacters,
  customStopWords,
} from "../utils/stopwords";
import { tokens as TOKENS } from "../utils/tokens";
import { getExchangeInfo, getExchangeInfoSymbols } from "./binance/market";

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

export const getTickersPrice = async (
  symbols: string[]
): Promise<BinanceTicker[]> => {
  return BinanceClient.tickerPrice("", symbols)
    .then((response: any) => response.data as BinanceTicker[])
    .catch((err: BinanceError) => {
      console.error(err.response.data);
      throw err.response.data;
    });
};

export const getBinanceExchangeInfoSymbols = async () => {
  return await getExchangeInfo()
    .then((info) => info.symbols.filter((s) => s.quoteAsset === "USDT"))
    .catch((err) => {
      console.error(err);
      return [] as ExchangeInfoSymbol[];
    });
};

export const getAvailableSymbolsOnBinance = async (symbols: string[]) => {
  const exchangeInfoSymbols = await getBinanceExchangeInfoSymbols();
  const availableInfoSymbols = exchangeInfoSymbols.filter(
    (exchangeInfoSymbol) => symbols.some((s) => s === exchangeInfoSymbol.symbol)
  );
  if (!availableInfoSymbols.length) return [];

  const updatedInfoSymbols = await getExchangeInfoSymbols(
    availableInfoSymbols.map((s) => s.symbol)
  );
  return updatedInfoSymbols;
};
