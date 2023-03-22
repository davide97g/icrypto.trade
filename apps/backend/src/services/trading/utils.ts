// *** UTILITY FUNCTIONS ***

import {
  ExchangeInfoSymbol,
  ExchangeInfoSymbolFilter,
} from "../../models/account";
import { BinanceTicker } from "../../models/binance";
import { Fill } from "../../models/orders";
import { roundToNDigits } from "../../utils/utils";

export const findTickerPrice = (
  symbol: string,
  tickerPrices: BinanceTicker[]
) => {
  return tickerPrices.find((tickerPrice) => tickerPrice?.symbol === symbol);
};

export const calculateOrderQuantity = (
  tradeAmount: number,
  tickerPrice: number,
  precision: number
) => {
  return roundToNDigits(tradeAmount / tickerPrice, precision - 1);
};

export const calculateAvgMarketBuyPrice = (fills: Fill[]) => {
  const totalQty = fills.reduce((acc, fill) => acc + parseFloat(fill.qty), 0);
  const totalPrice = fills.reduce(
    (acc, fill) => acc + parseFloat(fill.price) * parseFloat(fill.qty),
    0
  );

  return totalPrice / totalQty;
};

export const findFilterByType = (
  filters: ExchangeInfoSymbolFilter[],
  filterType: string
) => {
  return filters.find((f) => f.filterType === filterType)!;
};

export const getPrecision = (sizeString: string, precision: number) => {
  return sizeString.indexOf("1") > -1
    ? sizeString.replace(".", "").indexOf("1")
    : precision;
};

export const computeQuantity = (
  exchangeInfoSymbol: ExchangeInfoSymbol,
  orderQty: number,
  precision: number
) => {
  const filterLotSize = findFilterByType(
    exchangeInfoSymbol.filters,
    "LOT_SIZE"
  );
  if (!filterLotSize) throw new Error("Lot size filter not found");

  const { maxQty, minQty, stepSize } = filterLotSize;
  const maxLotSizeQty = parseFloat(maxQty || "0");
  const minLotSizeQty = parseFloat(minQty || "0");
  const stepSizeValue = parseFloat(stepSize || "0.10000000");
  const stepSizePrecision = getPrecision(stepSize || "0.10000000", precision);

  console.info("stepSizePrecision", stepSizePrecision);

  const filterMinNotional = findFilterByType(
    exchangeInfoSymbol.filters,
    "MIN_NOTIONAL"
  );
  const minNotional = parseFloat(
    filterMinNotional?.minNotional || "10.00000000"
  );

  const safeQty = orderQty - stepSizeValue;
  const minimumQuantity = Math.max(safeQty, minNotional, minLotSizeQty);
  const quantity = roundToNDigits(
    Math.min(minimumQuantity, maxLotSizeQty),
    stepSizePrecision
  );

  console.info("📈 quantity", quantity);

  return quantity;
};

export const computePrice = (
  avgPrice: number,
  orderPrice: number,
  exchangeInfoSymbol: ExchangeInfoSymbol
) => {
  const filterPercentPriceBySide = findFilterByType(
    exchangeInfoSymbol.filters,
    "PERCENT_PRICE_BY_SIDE"
  );
  const { askMultiplierUp, askMultiplierDown } = filterPercentPriceBySide;
  const multiplierUp = parseFloat(askMultiplierUp || "5");
  const multiplierDown = parseFloat(askMultiplierDown || "0.2");

  const downLimitPrice = avgPrice * multiplierDown;
  const upLimitPrice = avgPrice * multiplierUp;
  const price = Math.max(Math.min(orderPrice, upLimitPrice), downLimitPrice);

  const filterPriceFilter = findFilterByType(
    exchangeInfoSymbol.filters,
    "PRICE_FILTER"
  );
  const { maxPrice, minPrice, tickSize } = filterPriceFilter;
  const maxPriceValue = parseFloat(maxPrice || "0");
  const minPriceValue = parseFloat(minPrice || "0");
  const tickSizePrecision = getPrecision(
    tickSize || "0.00010000",
    exchangeInfoSymbol.baseAssetPrecision
  );

  const notRoundedPrice = Math.min(
    Math.max(price, minPriceValue),
    maxPriceValue
  );
  const finalPrice = roundToNDigits(notRoundedPrice, tickSizePrecision);

  return finalPrice;
};
