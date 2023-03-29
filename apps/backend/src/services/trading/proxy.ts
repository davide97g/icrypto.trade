import { ExchangeInfoSymbol } from "../../models/account";
import { NewOCOOrderRequest } from "../../models/orders";
import { getKlines } from "../binance/market";
import { getNews } from "../bot/bot";
import { WebSocket } from "ws";
import { KlineRecord, Strategy } from "./types";

// TODO: convert to RTDB
export const STRATEGY_MAP = new Map<string, Strategy>(); // LOCAL MAP TO STORE WS REFERENCES

export const getStrategyByNewsId = async (newsId: string) => {
  for (const strategy of STRATEGY_MAP.values()) {
    if (strategy.newsId === newsId) return strategy;
  }
  return null;
};

export const addStrategy = async (
  symbol: string,
  orderListId: number,
  request: NewOCOOrderRequest,
  lastOrderTime: number,
  exchangeInfoSymbol: ExchangeInfoSymbol,
  wsRef: WebSocket,
  newsId?: string
) => {
  const klinesRecords: KlineRecord[] = await getKlines(symbol, "1m", 1000);

  const openKline = klinesRecords[klinesRecords.length - 1];

  const openPrice = parseFloat(openKline.closePrice);
  //openVolume probably not needed since is the volume in the kline until now, not the closing volume: getNewsKline is better
  const openVolume = parseFloat(openKline.volume);

  const averageVolume =
    klinesRecords.reduce((acc, kline) => {
      return acc + parseFloat(kline.volume);
    }, 0.0) / klinesRecords.length;

  const averageMove =
    klinesRecords.reduce((acc, kline, index) => {
      if (index === 0) return acc;
      const previousKline = klinesRecords[index - 1];
      const move =
        Math.abs(
          parseFloat(kline.closePrice) - parseFloat(previousKline.closePrice)
        ) / parseFloat(previousKline.closePrice);
      return acc + move;
    }, 0.0) / klinesRecords.length;

  const news = getNews(newsId);

  const likes = news ? news.likes : 0;
  const dislikes = news ? news.dislikes : 0;

  const strategy: Strategy = {
    lastOrderListId: orderListId,
    lastOcoOrderRequest: request,
    lastOcoOrderTime: lastOrderTime,
    exchangeInfoSymbol,
    data: [],
    history: klinesRecords,
    newsId,
    wsRef,
    stats: {
      constant: {
        openPrice,
        openVolume,
        averageMove,
        averageVolume,
      },
      variable: {
        eventTime: 0,
        likes,
        dislikes,
        lastPrice: openPrice, // ? ultimo prezzo = prezzo di apertura
        lastVolume: openVolume, // ? ultimo volume = volume di apertura
        lastMove: 0.0, // ? partiamo da un cambiamento nullo
        averageMoveSinceOpenList: [0.0], // ? lista dei cambiamenti dall'apertura
        averageVolumeSinceOpenList: [0.0], // ? lista dei volumi dall'apertura
        maxPriceSinceOpen: openPrice, // ? massimo prezzo dall'apertura
        minPriceSinceOpen: openPrice, // ? minimo prezzo dall'apertura
      },
    },
  };
  console.info(strategy.lastOcoOrderRequest, strategy.stats);
  STRATEGY_MAP.set(symbol, strategy); // TODO: replace with RTDB
};

export const updateStrategy = async (
  symbol: string,
  data: Partial<Strategy>
) => {
  const strategy = STRATEGY_MAP.get(symbol);
  if (!strategy) return;
  STRATEGY_MAP.set(symbol, { ...strategy, ...data }); // TODO: replace with RTDB
};

export const removeStrategy = async (symbol: string) => {
  STRATEGY_MAP.delete(symbol); // TODO: replace with RTDB
};
