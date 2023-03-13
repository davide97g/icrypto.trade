import { defineStore } from "pinia";
import { Symbol } from "../models/token";

export const useSymbolsStore = defineStore("symbols", {
  state: () => {
    return {
      symbols: [] as Symbol[],
    };
  },
  actions: {
    setExchangeInfo(symbols: Symbol[]) {
      this.symbols = symbols;
    },
  },
});
