export interface TradeConfig {
  feedLimit: number; // number of feed items to fetch
  nLikes: number;
  nMinutes: number;
  takeProfitPercentage: number;
  stopLossPercentage: number;
  tradeAmount: number;
}
