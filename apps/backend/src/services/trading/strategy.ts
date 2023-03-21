import { BinanceClient } from "../../config/binance";
import { NewOCOOrderRequest } from "../../models/orders";
import { cancelOCOOrder, newOCOOrder } from "../orders";
import { cleanKline } from "./mapping";
import { BinanceInterval, Kline, Strategy, StrategyStats } from "./types";
import { WebSocket } from "ws";

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
      onNewKline(symbol, klineData.kline);
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
  openPrice: string,
  request: NewOCOOrderRequest,
  orderListId: number
) => {
  const wsRef = subscribeKlineWS(symbol, "1m");
  addStrategy(symbol, orderListId, openPrice, request, wsRef);
  // setTimeout(() => {
  //   unsubscribeTickerWS(symbol, wsRef);
  // }, 60000);
};

const STRATEGY_MAP = new Map<string, Strategy>(); // LOCAL MAP TO STORE WS REFERENCES

const addStrategy = (
  symbol: string,
  orderListId: number,
  openPrice: string,
  request: NewOCOOrderRequest,
  wsRef: WebSocket
) => {
  const strategy: Strategy = {
    openPrice,
    lastOrderListId: orderListId,
    lastOcoOrderRequest: request,
    data: [],
    wsRef,
  };
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

const onNewKline = (symbol: string, kline: Kline) => {
  if (!STRATEGY_MAP.has(symbol)) return;
  const strategy = STRATEGY_MAP.get(symbol);
  if (!strategy) return;
  insertData(strategy, kline);
  console.info("new kline");
  analyzeStrategy(strategy);
};

const insertData = (strategy: Strategy, kline: Kline) => {
  strategy.data.push(kline);
  // - *open_price* (prezzo di esecuzione dell’ordine iniziale, quello di acquisto dovuto alla news)
  // - *last_price* (prezzo di mercato disponibile. Se non c’è direttamente, media tra prezzi bid e ask)
  // - *last_move* (differenza percentuale del prezzo tra la candela attuale e la candela precedente. Su Binance si chiama *change*)
  // - *average_move* (media nelle ultime 24 ore dei movimenti nelle candele a 1 minuto. Non serve ricalcolarlo ogni volta, basta la prima perché lo supponiamo costante)
  // - *average_move_since_open* (media movimenti candele 1 minuto a partire dalla candela del minuto dove è uscita la news) Penso l’ideale sarebbe un array e ad ogni minuto aggiunge un nuovo elemento
  // - *average_volume* (media nelle ultime 24 ore dei volumi nelle candele a 1 minuto. Non serve ricalcolarlo ogni volta, basta la prima perché lo supponiamo costante)
  // - *open_volume* (volume della candela a 1 minuto nel minuto della news)
  // - *average_volume_since_open* (media volumi candele 1 minuto a partire dalla candela del minuto dove è uscita la news) Penso l’ideale sarebbe un array e ad ogni minuto aggiunge un nuovo elemento. In questo modo: *open_volume* = *average_volume_since_open* [0]
  // - *last_volume*
  // - *max_price_since_open*
  // - *min_price_since_open*
  const openPrice = parseFloat(strategy.openPrice);
  const lastPrice = parseFloat(kline.closePrice);
  const stats: StrategyStats = {
    openPrice,
    lastPrice,
    lastMove: (lastPrice - openPrice) / openPrice,
    averageMove: 0.0,
    averageMoveSinceOpen: 0.0,
    averageVolume: 0.0,
    openVolume: 0.0,
    averageVolumeSinceOpen: 0.0,
    lastVolume: 0.0,
    maxPriceSinceOpen: 0.0,
    minPriceSinceOpen: 0.0,
  };
  strategy.stats = stats; // update the stats in any case (even if they are null)
};

const analyzeStrategy = async (strategy: Strategy) => {
  if (!needsUpdate(strategy)) return;

  const request = createOCOOrderRequest(strategy);

  await cancelReplaceOCOOrder(
    request.symbol,
    strategy.lastOrderListId.toString(),
    request
  );
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
  const request: NewOCOOrderRequest = {
    symbol: strategy.lastOcoOrderRequest.symbol,
    quantity: strategy.lastOcoOrderRequest.quantity,
    takeProfitPrice: strategy.lastOcoOrderRequest.takeProfitPrice,
    stopLossPrice: strategy.lastOcoOrderRequest.stopLossPrice,
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
