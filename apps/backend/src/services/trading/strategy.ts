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
  request: NewOCOOrderRequest,
  orderListId: number
) => {
  const wsRef = subscribeKlineWS(symbol, "1m");
  addStrategy(symbol, orderListId, request, wsRef);
  // setTimeout(() => {
  //   unsubscribeTickerWS(symbol, wsRef);
  // }, 60000);
};

const STRATEGY_MAP = new Map<string, Strategy>(); // LOCAL MAP TO STORE WS REFERENCES

const addStrategy = async (
  symbol: string,
  orderListId: number,
  request: NewOCOOrderRequest,
  wsRef: WebSocket
) => {
  const klinesRecords: KlineRecord[] = await getKlines(symbol, "1m", 1000);

  const openKline = klinesRecords[klinesRecords.length - 1];

  const openPrice = parseFloat(openKline.closePrice);
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
        (parseFloat(kline.closePrice) - parseFloat(previousKline.closePrice)) /
        parseFloat(previousKline.closePrice);
      return acc + move;
    }, 0.0) / klinesRecords.length;

  const strategy: Strategy = {
    lastOrderListId: orderListId,
    lastOcoOrderRequest: request,
    data: [],
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

  console.info("strategy added");
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

const onNewKline = (symbol: string, kline: Kline, eventTime: number) => {
  if (!STRATEGY_MAP.has(symbol)) return;
  const strategy = STRATEGY_MAP.get(symbol);
  if (!strategy) return;
  insertData(strategy, kline, eventTime);
  analyzeStrategy(strategy);
};

const insertData = (strategy: Strategy, kline: Kline, eventTime: number) => {
  if (
    !kline.isKlineClosed &&
    eventTime - 60 * 1000 <= strategy.stats.variable.eventTime // ? only the last kline (1m interval)
  )
    return;

  strategy.data.push(kline);

  const lastPrice = parseFloat(kline.closePrice);
  const baseAssetVolume = parseFloat(kline.baseAssetVolume);
  const highPrice = parseFloat(kline.highPrice);
  const lowPrice = parseFloat(kline.lowPrice);

  const { stats } = strategy;

  const previousLastPrice = strategy.stats.variable.lastPrice;
  const lastMove = (lastPrice - previousLastPrice) / previousLastPrice;

  const variableStats: StrategyVariableStats = {
    eventTime,
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
};

const analyzeStrategy = async (strategy: Strategy) => {
  if (!needsUpdate(strategy)) return;

  const request = createOCOOrderRequest(strategy);
  console.info("📝 New request", request);

  await cancelReplaceOCOOrder(
    request.symbol,
    strategy.lastOrderListId.toString(),
    request
  );
  console.info("🚀 OCO Order updated");
};

const needsUpdate = (strategy: Strategy) => {
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
  return false;
};

const createOCOOrderRequest = (strategy: Strategy) => {
  // TODO: compute new prices based on kline data

  const priceChangeUp = 0.0;
  const priceChangeDown = 0.0;

  const request: NewOCOOrderRequest = {
    symbol: strategy.lastOcoOrderRequest.symbol,
    quantity: strategy.lastOcoOrderRequest.quantity,
    takeProfitPrice:
      strategy.lastOcoOrderRequest.takeProfitPrice + priceChangeUp,
    stopLossPrice: strategy.lastOcoOrderRequest.stopLossPrice - priceChangeDown,
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
  const ocoOrder = await newOCOOrder(request);
  updateStrategy(symbol, ocoOrder.orderListId, request);
};
