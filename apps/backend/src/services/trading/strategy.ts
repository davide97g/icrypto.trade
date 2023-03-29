import { BinanceClient } from "../../config/binance";
import { NewOCOOrderRequest } from "../../models/orders";
import { cancelOCOOrder, newOCOOrder } from "../orders";
import { cleanKline } from "./mapping";
import {
  BinanceInterval,
  Kline,
  KlineRecord,
  Strategy,
  StrategyVariableStats,
} from "./types";
import { WebSocket } from "ws";
import { getKlines } from "../binance/market";
import { computePrice } from "./utils";
import { ExchangeInfoSymbol } from "../../models/account";
import { getNews, getWS } from "../bot/bot";
import { subscribeSymbolTrade, unsubscribeSymbolTrade } from "../trades";
import { telegramApi } from "../../connections/telegram";

const subscribeKlineWS = (symbol: string, interval: BinanceInterval) => {
  const callbacks = {
    open: () => {
      console.log(`open klines@${symbol}`);
    },
    close: () => {
      console.log(`close klines@${symbol}`);
    },
    message: (msg: string) => {
      const kline_raw = JSON.parse(msg);
      const klineData = cleanKline(kline_raw);
      onNewKline(symbol, klineData.kline, klineData.eventTime);
    },
    error: (error: Error) => {
      console.log(error);
    },
  };
  return BinanceClient.klineWS(symbol, interval, callbacks);
};

export const stopStrategy = (symbol: string) => {
  const strategy = STRATEGY_MAP.get(symbol);
  if (!strategy) return;
  const { wsRef } = strategy;
  BinanceClient.unsubscribe(wsRef);
  removeStrategy(symbol);
};

export const startStrategy = (
  symbol: string,
  exchangeInfoSymbol: ExchangeInfoSymbol,
  request: NewOCOOrderRequest,
  orderListId: number,
  startingTime: number,
  newsId?: string
) => {
  const wsRef = subscribeKlineWS(symbol, "1m");
  addStrategy(
    symbol,
    orderListId,
    request,
    startingTime,
    exchangeInfoSymbol,
    wsRef,
    newsId
  );
};

const STRATEGY_MAP = new Map<string, Strategy>(); // LOCAL MAP TO STORE WS REFERENCES

const getStrategyByNewsId = (newsId: string) => {
  for (const strategy of STRATEGY_MAP.values()) {
    if (strategy.newsId === newsId) return strategy;
  }
  return null;
};

const addStrategy = async (
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
  const newsTime = news ? news.time : 0;

  const likes = news ? news.likes : 0;
  const dislikes = news ? news.dislikes : 0;

  const strategy: Strategy = {
    lastOrderListId: orderListId,
    lastOcoOrderRequest: request,
    exchangeInfoSymbol,
    data: [],
    newsId,
    wsRef,
    stats: {
      constant: {
        openPrice,
        openVolume,
        averageMove,
        averageVolume,
        newsTime,
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
        lastOrderTime,
      },
    },
  };
  console.info(strategy.lastOcoOrderRequest, strategy.stats);
  STRATEGY_MAP.set(symbol, strategy);
};

const updateStrategy = (
  symbol: string,
  orderListId: number,
  request: NewOCOOrderRequest
) => {
  const strategy = STRATEGY_MAP.get(symbol);
  if (strategy) {
    strategy.lastOrderListId = orderListId;
    strategy.lastOcoOrderRequest = request;
  }
};

const removeStrategy = (symbol: string) => {
  STRATEGY_MAP.delete(symbol);
};

export const feedbackUpdate = (
  newsId: string,
  likes: number,
  dislikes: number
) => {
  const strategy = getStrategyByNewsId(newsId);
  if (strategy) {
    strategy.stats.variable.likes = likes;
    strategy.stats.variable.dislikes = dislikes;
    analyzeStrategy(strategy);
  }
};

const onNewKline = (symbol: string, kline: Kline, eventTime: number) => {
  if (!STRATEGY_MAP.has(symbol)) return;
  const strategy = STRATEGY_MAP.get(symbol);
  if (!strategy) return;
  insertData(strategy, kline, eventTime);
  analyzeStrategy(strategy);
};

const insertData = (strategy: Strategy, kline: Kline, eventTime: number) => {
  if (!strategy.data.length) strategy.data.push(kline);
  else {
    const previous = strategy.data[strategy.data.length - 1];
    if (previous.startTime === kline.startTime) {
      strategy.data[strategy.data.length - 1] = kline;
      //baseAssetVolume and lastMove should replace the last value if the kline is the same
      //to do this we need to remove the last value from the list
      strategy.stats.variable.averageMoveSinceOpenList =
        strategy.stats.variable.averageMoveSinceOpenList.slice(0, -1);
      strategy.stats.variable.averageVolumeSinceOpenList =
        strategy.stats.variable.averageVolumeSinceOpenList.slice(0, -1);
    } else strategy.data.push(kline);
  }

  const lastPrice = parseFloat(kline.closePrice);
  const highPrice = parseFloat(kline.highPrice);
  const lowPrice = parseFloat(kline.lowPrice);
  const baseAssetVolume = parseFloat(kline.baseAssetVolume);

  const { stats } = strategy;

  //lastMove is the difference between the last price and the previous last price, i.e. the closing price of the previous kline
  const previous =
    strategy.data.length > 1 ? strategy.data[strategy.data.length - 2] : kline;
  const previousLastPrice = parseFloat(previous.closePrice);
  const lastMove = Math.abs(lastPrice - previousLastPrice) / previousLastPrice;

  const variableStats: StrategyVariableStats = {
    eventTime,
    likes: stats.variable.likes,
    dislikes: stats.variable.dislikes,
    lastPrice,
    lastMove,
    lastVolume: baseAssetVolume,
    averageMoveSinceOpenList: stats.variable.averageMoveSinceOpenList.concat([
      lastMove,
    ]),
    averageVolumeSinceOpenList:
      stats.variable.averageVolumeSinceOpenList.concat([baseAssetVolume]),
    maxPriceSinceOpen: Math.max(
      highPrice,
      strategy.stats.variable.maxPriceSinceOpen
    ),
    minPriceSinceOpen: Math.min(
      lowPrice,
      strategy.stats.variable.minPriceSinceOpen
    ),
    lastOrderTime: strategy.stats.variable.lastOrderTime,
  };
  strategy.stats.variable = variableStats;
};

const analyzeStrategy = async (strategy: Strategy) => {
  const request = tryUpdate(strategy);
  if (request) {
    await cancelReplaceOCOOrder(
      request.symbol,
      strategy.lastOrderListId.toString(),
      request
    );
    strategy.stats.variable.lastOrderTime = Date.now();
    telegramApi.sendMessageToDevs("🚀 OCO Order updated");
  }
};

// function that returns the kline in which the news happened
const getNewsKline = (strategy: Strategy) => {
  const { data, stats } = strategy;
  const { newsTime } = stats.constant;
  // TODO: change data to historicalData
  const newsKline = data.find(
    (kline) => kline.startTime < newsTime && kline.closeTime > newsTime
  );
  return newsKline;
};

const tryUpdate = (strategy: Strategy) => {
  //   Le condizioni con cui giocare sono:

  // 1. last_price / *max_price_since_open* > parametro
  // 2. *last_move* / *average_move* > parametro
  // 3. *last_move* / *average_move_since_open* > parametro
  // 4. *last_volume* / *average_volume* > parametro
  // 5. *last_volume* / *average_volume_since_open*> parametro

  // Intuitivamente:

  // 1. Se il prezzo è sceso troppo dai massimi
  // 2. Se il movimento sta tornando vicino alla sua media
  // 3. Se il movimento si sta spegnendo, diventando sempre meno ampio rispetto all’esplosione dovuta alla news
  // 4. Se il volume sta tornando vicino alla sua media
  // 5. Se il volume (in dollari!) si sta spegnendo, diventando sempre meno pronunciato rispetto all’esplosione dovuta alla news
  // TODO: implement this

  //if the volume is less than 2 times the average volume, then update the order because the volume is fading
  //if (strategy.stats.variable.lastVolume / strategy.stats.constant.averageVolume < 2) return true;

  //if the volume is less than 0.5 times the average volume since open, then update the order because the volume is fading
  //if (strategy.stats.variable.lastVolume / avgArray(strategy.stats.variable.averageVolumeSinceOpenList) < 0.5) return true;

  //strategies relative to the time
  const timeSinceLastOCOUpdate =
    Date.now() - strategy.stats.variable.lastOrderTime;
  const timeSinceNews =
    strategy.stats.constant.newsTime === 0
      ? 0
      : Date.now() - strategy.stats.constant.newsTime;

  console.info("Time since last update:", timeSinceLastOCOUpdate);
  console.info("Time since the news:", timeSinceNews);

  console.info(strategy.stats);
  console.info(
    "The number of seconds in the eventTime is:",
    (strategy.stats.variable.eventTime % (60 * 1000)) / 1000
  );

  const takeProfitPriceChange =
    strategy.lastOcoOrderRequest.takeProfitPrice /
    strategy.stats.variable.lastPrice;
  const needsUpdate = takeProfitPriceChange < 1.01; // ? change less than 1%

  if (!needsUpdate) return null;

  const kline = getNewsKline(strategy)!;

  // TODO: implement better strategy to follow up the price
  const firstUpsideMove =
    (parseFloat(kline.highPrice) - parseFloat(kline.openPrice)) /
    parseFloat(kline.openPrice);
  const firstDownsideMove =
    (parseFloat(kline.lowPrice) - parseFloat(kline.openPrice)) /
    parseFloat(kline.openPrice);
  //first stop loss is at 20% of the first upside move (80% retracement is accettable)
  const firstStopLoss =
    parseFloat(kline.openPrice) * (1 + firstUpsideMove * 0.2);

  const firstVolume = parseFloat(kline.baseAssetVolume);
  //if the volume is not significant, then close sooner
  if (firstVolume / strategy.stats.constant.averageVolume < 2) {
  }

  const { tradeConfig } = getWS();
  const takeProfitPercentage = tradeConfig!.takeProfitPercentage / 100;
  const stopLossPercentage = tradeConfig!.stopLossPercentage / 100;
  const TP = (1 + takeProfitPercentage) * strategy.stats.variable.lastPrice;
  const SL = (1 - stopLossPercentage) * strategy.stats.variable.lastPrice;

  const newTakeProfitPrice = computePrice(TP, TP, strategy.exchangeInfoSymbol);

  const newStopLossPrice = computePrice(SL, SL, strategy.exchangeInfoSymbol);

  const request: NewOCOOrderRequest = {
    symbol: strategy.lastOcoOrderRequest.symbol,
    quantity: strategy.lastOcoOrderRequest.quantity,
    takeProfitPrice: newTakeProfitPrice,
    stopLossPrice: newStopLossPrice,
    timeInForce: "GTC",
  };
  return request;
};

const cancelReplaceOCOOrder = async (
  symbol: string,
  orderListId: string,
  request: NewOCOOrderRequest
) => {
  await cancelOCOOrder(symbol, orderListId);
  unsubscribeSymbolTrade(symbol);
  const ocoOrder = await newOCOOrder(request);
  subscribeSymbolTrade(
    symbol,
    ocoOrder.orders.map((order) => order.orderId)
  );
  updateStrategy(symbol, ocoOrder.orderListId, request);
};
