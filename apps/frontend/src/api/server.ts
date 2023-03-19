import axios from "axios";
import { setIsLoading } from "../services/utils";
import { TradesRoutes } from "./routes/trades";
import { AccountRoutes } from "./routes/account";
import { BotRoutes } from "./routes/bot";
import { SymbolsRoutes } from "./routes/symbols";
import { OrdersRoutes } from "./routes/orders";
import { NewsRoutes } from "./routes/news";
import { FeedRoutes } from "./routes/feed";

export const apiHost =
  window.location.href.includes("localhost") ||
  window.location.href.includes("127.0.0.1")
    ? "http://localhost:3000"
    : "https://icryptotrade.herokuapp.com";

export const API = axios.create({
  baseURL: apiHost,
  timeout: 10000,
});

export const ApiClient = {
  Server: {
    getInfo: async (): Promise<{
      version: string;
      env: "test" | "production";
    }> => {
      setIsLoading(true);
      return await API.get(`${apiHost}/info`)
        .then(
          (res) => res.data as { version: string; env: "test" | "production" }
        )
        .catch((err) => {
          console.error(err);
          throw err;
        })
        .finally(() => setIsLoading(false));
    },
  },
  Account: AccountRoutes,
  Feed: FeedRoutes,
  News: NewsRoutes,
  Orders: OrdersRoutes,
  Trades: TradesRoutes,
  Symbols: SymbolsRoutes,
  Bot: BotRoutes,
};
