import { defineStore } from "pinia";
import { ExchangeInfo } from "../models/account";

export const useBinanceStore = defineStore("binance", {
  state: () => {
    return {
      exchangeInfo: {} as ExchangeInfo,
    };
  },
  actions: {
    setExchangeInfo(exchangeInfo: ExchangeInfo) {
      this.exchangeInfo = exchangeInfo;
    },
  },
});
