import { NewOCOOrderRequest } from "icrypto.trade-types/orders";
import { getNews, getWS } from "../bot/bot";
import { Strategy } from "./types";
import { computePrice } from "./utils";

const getNewsKline = (strategy: Strategy) => {
  const { history, newsId } = strategy;
  const news = getNews(newsId);
  if (!news) return;
  const newsKline = history.find(
    (kline) => kline.openTime <= news.time && news.time <= kline.closeTime
  );
  return newsKline;
};

export const tryUpdate = (strategy: Strategy) => {
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
  const news = getNews(strategy.newsId);
  const timeSinceLastOCOUpdate = Date.now() - strategy.lastOcoOrderTime;
  const timeSinceNews =
    !news || !news.time ? 0 : Date.now() - strategy.lastOcoOrderTime;

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

  const kline = getNewsKline(strategy);
  if (!kline) return null;

  const firstUpsideMove =
    (parseFloat(kline.highPrice) - parseFloat(kline.openPrice)) /
    parseFloat(kline.openPrice);
  const firstDownsideMove =
    (parseFloat(kline.lowPrice) - parseFloat(kline.openPrice)) /
    parseFloat(kline.openPrice);
  //first stop loss is at 20% of the first upside move (80% retracement is accettable)
  const firstStopLoss =
    parseFloat(kline.openPrice) * (1 + firstUpsideMove * 0.2);

  const firstVolume = parseFloat(kline.takerBuyBaseAssetVolume);
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
