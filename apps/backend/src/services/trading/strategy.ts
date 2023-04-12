import { BinanceClient } from "../../config/binance";
import { NewOCOOrderRequest } from "../../models/orders";
import { cancelOCOOrder, newOCOOrder } from "../orders";
import { cleanKline } from "./mapping";
import {
  BinanceInterval,
  Kline,
  Strategy,
  StrategyVariableStats,
} from "./types";
import { ExchangeInfoSymbol } from "../../models/account";
import { subscribeSymbolTrade, unsubscribeSymbolTrade } from "../trades";
import { telegramApi } from "../../connections/telegram";
import {
  addStrategy,
  getStrategy,
  getStrategyByNewsId,
  removeStrategy,
  updateStrategy,
} from "./proxy";
import { tryUpdate } from "./update";

const subscribeKlineWS = (symbol: string, interval: BinanceInterval) => {
  const callbacks = {
    open: () => {
      console.log(`open klines@${symbol}`);
    },
    close: () => {
      console.log(`close klines@${symbol}`);
    },
    message: async (msg: string) => {
      const kline_raw = JSON.parse(msg);
      const klineData = cleanKline(kline_raw);
      const strategy = await getStrategy(klineData.symbol);
      if (!strategy) return;
      onKlineUpdate(strategy, klineData.kline, klineData.eventTime);
    },
    error: (error: Error) => {
      console.log(error);
    },
  };
  return BinanceClient.klineWS(symbol, interval, callbacks);
};

export const stopStrategy = async (symbol: string) => {
  const strategy = await getStrategy(symbol);
  if (!strategy) return;
  const { wsRef } = strategy;
  BinanceClient.unsubscribe(wsRef);
  await removeStrategy(symbol);
};

export const startStrategy = async (
  symbol: string,
  exchangeInfoSymbol: ExchangeInfoSymbol,
  request: NewOCOOrderRequest,
  orderListId: number,
  startingTime: number,
  newsId?: string
) => {
  const wsRef = subscribeKlineWS(symbol, "1m");
  await addStrategy(
    symbol,
    orderListId,
    request,
    startingTime,
    exchangeInfoSymbol,
    wsRef,
    newsId
  );
};

export const onFeedbackUpdate = async (
  newsId: string,
  likes: number,
  dislikes: number
) => {
  const strategy = await getStrategyByNewsId(newsId);
  if (strategy) {
    strategy.stats.variable.likes = likes;
    strategy.stats.variable.dislikes = dislikes;
    await updateStrategy(strategy.exchangeInfoSymbol.symbol, strategy);
    analyzeStrategy(strategy);
  }
};

const onKlineUpdate = (strategy: Strategy, kline: Kline, eventTime: number) => {
  if (!strategy.data) strategy.data = [];
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

  const { stats } = strategy;

  //lastMove is the difference between the previous close price and the previous open price
  //lastMove can not be refered to current kline because it is not closed yet and we can not extrapolate uniformly
  //with the volume we can suppose that the distribution during the 60 seconds is uniform, with the move we can not
  const previous =
    strategy.data.length > 1 ? strategy.data[strategy.data.length - 2] : kline;
  const previousOpenPrice = parseFloat(previous.openPrice);
  const lastMove =
    Math.abs(parseFloat(previous.closePrice) - previousOpenPrice) /
    previousOpenPrice;

  //regarding the volume, it's better to update the last volume only if the kline has started not too recently, i.e. the seconds in the event time are >10
  //this is to adjust only when the eventTime is less than the closeTime of the kline, i.e. the kline is still open
  //when the kline closes, a last onKlineUpdate is called but with eventTime > closeTime and eventTime really close to % 60*1000. That would cancel the last data
  const baseAssetVolume = ((eventTime % (60 * 1000)) > 10 *1000 || eventTime>kline.closeTime) ? 
                          parseFloat(kline.baseAssetVolume) : parseFloat(previous.baseAssetVolume);

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
  };
  strategy.stats.variable = variableStats;
  updateStrategy(strategy.exchangeInfoSymbol.symbol, { stats: strategy.stats });
  analyzeStrategy(strategy);
};

const analyzeStrategy = async (strategy: Strategy) => {
  const request = tryUpdate(strategy);
  if (request) {
    const ocoOrder = await cancelReplaceOCOOrder(
      request.symbol,
      strategy.lastOrderListId,
      request
    );

    await updateStrategy(request.symbol, {
      lastOrderListId: ocoOrder.orderListId,
      lastOcoOrderRequest: request,
      lastOcoOrderTime: ocoOrder.transactionTime,
    });

    telegramApi.sendMessageToDevs("🚀 OCO Order updated");
  }
};

const cancelReplaceOCOOrder = async (
  symbol: string,
  orderListId: number,
  request: NewOCOOrderRequest
) => {
  await cancelOCOOrder(symbol, orderListId);
  unsubscribeSymbolTrade(symbol);
  const ocoOrder = await newOCOOrder(request);
  subscribeSymbolTrade(
    symbol,
    ocoOrder.orders.map((order) => order.orderId)
  );
  return ocoOrder;
};
