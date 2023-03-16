// // write test for computeQuantity
// import { computeQuantity } from "./trade";
// import { describe, expect, test } from "@jest/globals";
// import { ExchangeInfoSymbol } from "../models/transactions";

// describe("computeQuantity", () => {
//   const mockExchangeInfoSymbol: ExchangeInfoSymbol = {
//     symbol: "TESTUSDT",
//     status: "TRADING",
//     baseAsset: "TEST",
//     baseAssetPrecision: 8,
//     quoteAsset: "USDT",
//     quotePrecision: 8,
//     quoteAssetPrecision: 8,
//     baseCommissionPrecision: 8,
//     quoteCommissionPrecision: 8,
//     orderTypes: [
//       "LIMIT",
//       "LIMIT_MAKER",
//       "MARKET",
//       "STOP_LOSS_LIMIT",
//       "TAKE_PROFIT_LIMIT",
//     ],
//     icebergAllowed: true,
//     ocoAllowed: true,
//     quoteOrderQtyMarketAllowed: true,
//     allowTrailingStop: true,
//     cancelReplaceAllowed: true,
//     isSpotTradingAllowed: true,
//     isMarginTradingAllowed: true,
//     filters: [
//       {
//         filterType: "PRICE_FILTER",
//         minPrice: "0.00100000",
//         maxPrice: "10000.00000000",
//         tickSize: "0.00100000",
//       },
//       {
//         filterType: "LOT_SIZE",
//         minQty: "0.10000000",
//         maxQty: "9222449.00000000",
//         stepSize: "0.10000000",
//       },
//       {
//         filterType: "MIN_NOTIONAL",
//         minNotional: "10.00000000",
//         applyToMarket: true,
//         avgPriceMins: 5,
//       },
//       {
//         filterType: "ICEBERG_PARTS",
//         limit: 10,
//       },
//       {
//         filterType: "MARKET_LOT_SIZE",
//         minQty: "0.00000000",
//         maxQty: "511733.16726893",
//         stepSize: "0.00000000",
//       },
//       {
//         filterType: "TRAILING_DELTA",
//         minTrailingAboveDelta: 10,
//         maxTrailingAboveDelta: 2000,
//         minTrailingBelowDelta: 10,
//         maxTrailingBelowDelta: 2000,
//       },
//       {
//         filterType: "PERCENT_PRICE_BY_SIDE",
//         bidMultiplierUp: "5",
//         bidMultiplierDown: "0.2",
//         askMultiplierUp: "5",
//         askMultiplierDown: "0.2",
//         avgPriceMins: 5,
//       },
//       {
//         filterType: "MAX_NUM_ORDERS",
//         maxNumOrders: 200,
//       },
//       {
//         filterType: "MAX_NUM_ALGO_ORDERS",
//         maxNumAlgoOrders: 5,
//       },
//     ],
//     permissions: ["SPOT", "MARGIN"],
//     defaultSelfTradePreventionMode: "NONE",
//     allowedSelfTradePreventionModes: [
//       "NONE",
//       "EXPIRE_TAKER",
//       "EXPIRE_MAKER",
//       "EXPIRE_BOTH",
//     ],
//   };
//   test("should compute quantity", () => {
//     const quantity = computeQuantity(mockExchangeInfoSymbol, 100, 2);
//     expect(quantity).toBe(200);
//   });
// });
