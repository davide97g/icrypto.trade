import { NewOCOOrderRequest } from "../../models/orders";
import { avgArray } from "../../utils/utils";
import { getNews, getWS } from "../bot/bot";
import { Strategy } from "./types";
import { computePrice } from "./utils";

const getNewsKline = (strategy: Strategy) => {
  const { history, newsId } = strategy;
  const news = getNews(newsId);
  //if there is no news, then return a random kline from the history
  //create a random number between 0 and the length of the history
  const randomIndex = Math.floor(Math.random() * history.length);
  if (!news) return history[randomIndex];
  const newsKline = history.find(
    (kline) => kline.openTime <= news.time && news.time <= kline.closeTime
  );
  return newsKline;
};

export const tryUpdate = (strategy: Strategy) => {
  //the max stop loss that a user can tollerate. Should be a FE parameter
  const maxStopLossPercentage = 0.1;

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
  const timeSinceNews = !news || !news.time ? 0 : Date.now() - news.time;

  console.info("Time since last update:", timeSinceLastOCOUpdate);
  console.info("Time since the news:", timeSinceNews);

  console.info(strategy.stats);
  console.info(
    "The number of seconds in the eventTime is:",
    (strategy.stats.variable.eventTime % (60 * 1000)) / 1000
  );

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

  //get the standard TP and SL percentages. Then update those based on various factors
  const { tradeConfig } = getWS();
  let takeProfitPercentage = tradeConfig!.takeProfitPercentage / 100;
  let stopLossPercentage = tradeConfig!.stopLossPercentage / 100;

  /* const takeProfitPriceChange =
    strategy.lastOcoOrderRequest.takeProfitPrice /
    strategy.stats.variable.lastPrice;
  const needsUpdate = takeProfitPriceChange < 1.01; // ? change less than 1% */

  let needsUpdate = false;
  //if less than 10 seconds from last update, then don't update
  if (timeSinceLastOCOUpdate > 1000 * 10) {
    //the conditions are different in the first 5 minutes
    //if (timeSinceNews < 1000 * 60 * 5 && strategy.stats.variable.averageVolumeSinceOpenList.length <= 6)

    let firstVolume = parseFloat(kline.volume);
    //if the kline is not closed yet, we need to adjust the volume used
    if (strategy.stats.variable.eventTime < kline.closeTime)
      firstVolume =
        (firstVolume * 60 * 1000) /
        (strategy.stats.variable.eventTime % (60 * 1000));
    //we need to adjust the volume used based on the time of the news
    if (news && news.time) {
      const timeNewsKline =
        (strategy.stats.variable.eventTime < kline.closeTime
          ? strategy.stats.variable.eventTime
          : kline.closeTime) - news!.time;
      firstVolume = (firstVolume * 60 * 1000) / timeNewsKline;
    }

    //IMPORTANT: the more the magic numbers differ from 1, the more important the factor is
    //moreover, a number >1 means that the we expect a spike in that metric (e.g. volume) and a number <1 means that we expect a fade in that metric
    //it's correct to repeat the same factor since we start from the input declared TP and SL percentages; after 5 minutes differently

    //adjust TP and SL based on the volume, specifically by the ratio of the first volume to the average volume (and a magic number)
    if (firstVolume > 0) {
      takeProfitPercentage =
        (takeProfitPercentage *
          (firstVolume / strategy.stats.constant.averageVolume)) /
        4;
      stopLossPercentage =
        (stopLossPercentage *
          (firstVolume / strategy.stats.constant.averageVolume)) /
        4;
      console.info(
        "The adjustments based on the first volume are:",
        takeProfitPercentage,
        "since the first volume is",
        firstVolume,
        "and the average volume is",
        strategy.stats.constant.averageVolume
      );
    }

    //same thing but with the volume of the current kline and a different magic number
    //remember that the lastVolume is updated only if the new kline is not too recent
    if (strategy.stats.variable.lastVolume > 0) {
      const currentVolume =
        strategy.stats.variable.eventTime % (60 * 1000) > 10 * 1000
          ? (strategy.stats.variable.lastVolume * 60 * 1000) /
            (strategy.stats.variable.eventTime % (60 * 1000))
          : strategy.stats.variable.lastVolume;
      takeProfitPercentage =
        (takeProfitPercentage *
          (currentVolume / strategy.stats.constant.averageVolume)) /
        2.5;
      stopLossPercentage =
        (stopLossPercentage *
          (currentVolume / strategy.stats.constant.averageVolume)) /
        2.5;
      console.info(
        "The adjustments based on the volume are:",
        takeProfitPercentage,
        "since the current volume is",
        currentVolume,
        "and the average volume is",
        strategy.stats.constant.averageVolume
      );

      //same thing but with the average volume since open and a different magic number
      if (avgArray(strategy.stats.variable.averageVolumeSinceOpenList) > 0) {
        takeProfitPercentage =
          (takeProfitPercentage *
            (currentVolume /
              avgArray(strategy.stats.variable.averageVolumeSinceOpenList))) /
          0.75;
        stopLossPercentage =
          (stopLossPercentage *
            (currentVolume /
              avgArray(strategy.stats.variable.averageVolumeSinceOpenList))) /
          0.75;
        console.info(
          "The adjustments based on the average volume are:",
          takeProfitPercentage,
          "since the current volume is",
          currentVolume,
          "and the average volume is",
          avgArray(strategy.stats.variable.averageVolumeSinceOpenList)
        );
      }
    }

    //similar thing but with the moves and not volumes
    if (strategy.stats.variable.lastMove > 0) {
      takeProfitPercentage =
        (takeProfitPercentage *
          (strategy.stats.variable.lastMove /
            strategy.stats.constant.averageMove)) /
        1.5;
      stopLossPercentage =
        (stopLossPercentage *
          (strategy.stats.variable.lastMove /
            strategy.stats.constant.averageMove)) /
        1.5;
      console.info(
        "The adjustments based on the move are:",
        takeProfitPercentage,
        "since the last move is",
        strategy.stats.variable.lastMove,
        "and the average move is",
        strategy.stats.constant.averageMove
      );

      //now using the average move since open
      if (avgArray(strategy.stats.variable.averageMoveSinceOpenList) > 0) {
        takeProfitPercentage =
          (takeProfitPercentage *
            (strategy.stats.variable.lastMove /
              avgArray(strategy.stats.variable.averageMoveSinceOpenList))) /
          0.9;
        stopLossPercentage =
          (stopLossPercentage *
            (strategy.stats.variable.lastMove /
              avgArray(strategy.stats.variable.averageMoveSinceOpenList))) /
          0.9;
        console.info(
          "The adjustments based on the average move are:",
          takeProfitPercentage,
          "since the last move is",
          strategy.stats.variable.lastMove,
          "and the average move is",
          avgArray(strategy.stats.variable.averageMoveSinceOpenList)
        );
      }
    }

    //now we should consider the spike in the price. First the max price since open
    takeProfitPercentage =
      (takeProfitPercentage *
        (strategy.stats.variable.lastPrice /
          strategy.stats.variable.maxPriceSinceOpen)) /
      1.15;
    stopLossPercentage =
      (stopLossPercentage *
        (strategy.stats.variable.lastPrice /
          strategy.stats.variable.maxPriceSinceOpen)) /
      1.15;
    console.info(
      "The adjustments based on the max price are:",
      takeProfitPercentage,
      "since the last price is",
      strategy.stats.variable.lastPrice,
      "and the max price is",
      strategy.stats.variable.maxPriceSinceOpen
    );
    //then the min price since open
    takeProfitPercentage =
      (takeProfitPercentage *
        (strategy.stats.variable.lastPrice /
          strategy.stats.variable.minPriceSinceOpen)) /
      0.85;
    stopLossPercentage =
      (stopLossPercentage *
        (strategy.stats.variable.lastPrice /
          strategy.stats.variable.minPriceSinceOpen)) /
      0.85;
    console.info(
      "The adjustments based on the min price are:",
      takeProfitPercentage,
      "since the last price is",
      strategy.stats.variable.lastPrice,
      "and the min price is",
      strategy.stats.variable.minPriceSinceOpen
    );

    //lastly we should consider the likes
    if (strategy.stats.variable.likes > 0) {
      takeProfitPercentage =
        takeProfitPercentage * strategy.stats.variable.likes * 1.1;
      stopLossPercentage =
        stopLossPercentage * strategy.stats.variable.likes * 1.1;
    }
    console.info(
      "The adjustments based on the likes are:",
      takeProfitPercentage,
      "since the likes are",
      strategy.stats.variable.likes
    );
    //and the dislikes. The dislikes are more punitive
    if (strategy.stats.variable.dislikes > 0) {
      takeProfitPercentage =
        takeProfitPercentage * strategy.stats.variable.dislikes * 0.6;
      stopLossPercentage =
        stopLossPercentage * strategy.stats.variable.dislikes * 0.6;
    }
    console.info(
      "The adjustments based on the dislikes are:",
      takeProfitPercentage,
      "since the dislikes are",
      strategy.stats.variable.dislikes
    );

    //let's set a max SL
    if (stopLossPercentage > maxStopLossPercentage) {
      stopLossPercentage = maxStopLossPercentage;
    }

    //if the TP or SL are more than 20% different from the previous, then update (if the previous TP was 5% adjust only for at least 4 or 6)
    const previousTPPercentage =
      (strategy.lastOcoOrderRequest.takeProfitPrice -
        strategy.stats.variable.lastPrice) /
      strategy.stats.variable.lastPrice;
    const previousSLPercentage =
      (strategy.stats.variable.lastPrice -
        strategy.lastOcoOrderRequest.stopLossPrice) /
      strategy.stats.variable.lastPrice;
    needsUpdate =
      takeProfitPercentage / previousTPPercentage < 0.8 ||
      takeProfitPercentage / previousTPPercentage > 1.2 ||
      stopLossPercentage / previousSLPercentage < 0.8 ||
      stopLossPercentage / previousSLPercentage > 1.2;
    //and the min adjustment is 0.5%
    needsUpdate =
      needsUpdate &&
      (Math.abs(previousTPPercentage - takeProfitPercentage) > 0.005 ||
        Math.abs(previousSLPercentage - stopLossPercentage) > 0.005);
    console.info("OCO need Update:", needsUpdate);
  }

  if (!needsUpdate) return null;

  const TP = (1 + takeProfitPercentage) * strategy.stats.variable.lastPrice;
  const SL = (1 - stopLossPercentage) * strategy.stats.variable.lastPrice;
  console.info(
    "The last TP was ",
    strategy.lastOcoOrderRequest.takeProfitPrice,
    "and the new TP is",
    TP
  );

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
