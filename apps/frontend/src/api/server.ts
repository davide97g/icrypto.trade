import axios from "axios";
import { FeedItem, News } from "../models/feed";
import { auth } from "../api/auth";
import { setIsLoading } from "../services/utils";
import {
  Account,
  BinanceOrder,
  ExchangeInfo,
  Kline,
  NewOrderRequest,
  TradeConfig,
  Transaction,
} from "../models/trade";
import { Symbol } from "../models/token";
import { BinanceOrderDetails, MyTrade } from "../models/orders";
import { BinanceError } from "../models/binance";

const apiHost =
  window.location.href.includes("localhost") ||
  window.location.href.includes("127.0.0.1")
    ? "http://localhost:3000"
    : "https://icryptotrade.herokuapp.com";

const getIdToken = async () => {
  return await auth.currentUser?.getIdToken();
};

export const Server = {
  getServerInfo: async (): Promise<{
    version: string;
    env: "test" | "production";
  }> => {
    setIsLoading(true);
    return await axios
      .get(`${apiHost}/info`)
      .then(
        (res) => res.data as { version: string; env: "test" | "production" }
      )
      .catch((err) => {
        console.error(err);
        throw err;
      })
      .finally(() => setIsLoading(false));
  },
  Roles: {
    createAdminUser: async (uid: string) => {
      setIsLoading(true);
      return await axios
        .post(
          `${apiHost}/roles/admin/create`,
          { uid },
          {
            headers: { authorization: `Bearer ${await getIdToken()}` },
          }
        )
        .then((res) => res.data)
        .catch((err) => console.log(err))
        .finally(() => setIsLoading(false));
    },
  },
  Feed: {
    getFeed: async (options?: {
      limit?: number;
      guess?: boolean;
    }): Promise<FeedItem[]> => {
      setIsLoading(true);
      return await axios
        .get(`${apiHost}/feed`, {
          headers: { authorization: `Bearer ${await getIdToken()}` },
          params: {
            limit: options?.limit,
            guess: options?.guess,
          },
        })
        .then((res) => res.data)
        .then((data) =>
          data.map((item: any) => ({
            ...item,
            likes: item.likes ?? 0,
            dislikes: item.dislikes ?? 0,
          }))
        )
        .catch((err) => console.error(err))
        .finally(() => setIsLoading(false));
    },
    getFeedById: async (id: string): Promise<FeedItem> => {
      setIsLoading(true);
      return await axios
        .get(`${apiHost}/feed/${id}`, {
          headers: { authorization: `Bearer ${await getIdToken()}` },
        })
        .then((res) => res.data)
        .then((item) => ({
          ...item,
          likes: item.likes ?? 0,
          dislikes: item.dislikes ?? 0,
        }))
        .catch((err) => console.error(err))
        .finally(() => setIsLoading(false));
    },
  },
  News: {
    get: async (options?: { time?: number }): Promise<News[]> => {
      setIsLoading(true);
      return await axios
        .get(`${apiHost}/news`, {
          headers: { authorization: `Bearer ${await getIdToken()}` },
          params: {
            time: options?.time,
          },
        })
        .then((res) => res.data)
        .then((data) =>
          data.map((item: any) => ({
            ...item,
            likes: item.likes ?? 0,
            dislikes: item.dislikes ?? 0,
          }))
        )
        .catch((err) => console.error(err))
        .finally(() => setIsLoading(false));
    },
    getById: async (id: string): Promise<News> => {
      setIsLoading(true);
      return await axios
        .get(`${apiHost}/news/${id}`, {
          headers: { authorization: `Bearer ${await getIdToken()}` },
        })
        .then((res) => res.data as News)
        .catch((err) => {
          console.error(err);
          throw err;
        })
        .finally(() => setIsLoading(false));
    },
    updateById: async (news: News): Promise<boolean> => {
      setIsLoading(true);
      return await axios
        .post(
          `${apiHost}/news/${news._id}`,
          { news },
          {
            headers: { authorization: `Bearer ${await getIdToken()}` },
          }
        )
        .then((res) => res.data)
        .catch((err) => {
          console.error(err);
          throw err;
        })
        .finally(() => setIsLoading(false));
    },
  },
  Scheduler: {
    startScheduler: async () => {
      setIsLoading(true);
      return await axios
        .post(
          `${apiHost}/scheduler/start`,
          {},
          {
            headers: { authorization: `Bearer ${await getIdToken()}` },
          }
        )
        .then((res) => res.data)
        .catch((err) => console.log(err))
        .finally(() => setIsLoading(false));
    },
    stopScheduler: async () => {
      setIsLoading(true);
      return await axios
        .post(
          `${apiHost}/scheduler/stop`,
          {},
          {
            headers: { authorization: `Bearer ${await getIdToken()}` },
          }
        )
        .then((res) => res.data)
        .catch((err) => console.log(err))
        .finally(() => setIsLoading(false));
    },
    getScheduler: async () => {
      setIsLoading(true);
      return await axios
        .get(`${apiHost}/scheduler`, {
          headers: { authorization: `Bearer ${await getIdToken()}` },
        })
        .then((res) => res.data)
        .catch((err) => console.error(err))
        .finally(() => setIsLoading(false));
    },
    getTradeConfig: async (): Promise<TradeConfig | null> => {
      setIsLoading(true);
      return await axios
        .get(`${apiHost}/scheduler/config`, {
          headers: { authorization: `Bearer ${await getIdToken()}` },
        })
        .then((res) => res.data)
        .catch((err) => console.error(err))
        .finally(() => setIsLoading(false));
    },
    updateTradeConfig: async (config: TradeConfig) => {
      setIsLoading(true);
      return await axios
        .post(
          `${apiHost}/scheduler/config`,
          { config },
          {
            headers: { authorization: `Bearer ${await getIdToken()}` },
          }
        )
        .then((res) => res.data)
        .catch((err) => console.error(err))
        .finally(() => setIsLoading(false));
    },
  },
  Token: {
    async get(): Promise<Symbol[] | null> {
      setIsLoading(true);
      return await axios
        .get(`${apiHost}/token`, {
          headers: { authorization: `Bearer ${await getIdToken()}` },
        })
        .then((res) => res.data)
        .catch((err) => console.error(err))
        .finally(() => setIsLoading(false));
    },
  },
  Orders: {
    get: async (symbol: string): Promise<BinanceOrderDetails[] | null> => {
      setIsLoading(true);
      return await axios
        .get(`${apiHost}/orders/${symbol}`, {
          headers: { authorization: `Bearer ${await getIdToken()}` },
        })
        .then((res) => res.data)
        .catch((err) => console.error(err))
        .finally(() => setIsLoading(false));
    },
    getTrades: async (symbol: string): Promise<MyTrade[]> => {
      setIsLoading(true);
      return await axios
        .get(`${apiHost}/orders/${symbol}/trades`, {
          headers: { authorization: `Bearer ${await getIdToken()}` },
        })
        .then((res) => res.data)
        .catch((err) => {
          console.error(err);
          throw err;
        })
        .finally(() => setIsLoading(false));
    },
    cancel: async (symbol: string, orderId: string) => {
      setIsLoading(true);
      return await axios
        .delete(`${apiHost}/orders/${symbol}/${orderId}`, {
          headers: { authorization: `Bearer ${await getIdToken()}` },
        })
        .then((res) => res.data as BinanceOrder)
        .catch((err: BinanceError) => {
          console.error(err);
          throw err;
        })
        .finally(() => setIsLoading(false));
    },
    cancelAll: async (symbol: string): Promise<BinanceOrder[] | null> => {
      setIsLoading(true);
      return await axios
        .delete(`${apiHost}/orders/${symbol}/all`, {
          headers: { authorization: `Bearer ${await getIdToken()}` },
        })
        .then((res) => res.data)
        .catch((err: BinanceError) => {
          console.error(err);
          throw err;
        })
        .finally(() => setIsLoading(false));
    },
    sellAll: async (symbol: string): Promise<BinanceOrder | null> => {
      setIsLoading(true);
      return await axios
        .post(
          `${apiHost}/orders/${symbol}/sell-all`,
          {},
          {
            headers: { authorization: `Bearer ${await getIdToken()}` },
          }
        )
        .then((res) => res.data)
        .catch((err) => console.error(err))
        .finally(() => setIsLoading(false));
    },
    createOrder: async (symbol: string, newsId: string) => {
      setIsLoading(true);
      return await axios
        .post(
          `${apiHost}/orders/create`,
          {
            symbol,
            newsId,
          },
          {
            headers: { authorization: `Bearer ${await getIdToken()}` },
          }
        )
        .then((res) => res.data as BinanceOrder)
        .catch((err: BinanceError) => {
          console.error(err);
          throw err;
        })
        .finally(() => setIsLoading(false));
    },
  },
  Transaction: {
    getAccount: async (): Promise<Account | null> => {
      setIsLoading(true);
      return await axios
        .get(`${apiHost}/transactions/account`, {
          headers: { authorization: `Bearer ${await getIdToken()}` },
        })
        .then((res) => res.data)
        .catch((err) => console.error(err))
        .finally(() => setIsLoading(false));
    },
    getExchangeInfo: async () => {
      setIsLoading(true);
      return await axios
        .get(`${apiHost}/transactions/exchange-info`, {
          headers: { authorization: `Bearer ${await getIdToken()}` },
        })
        .then((res) => res.data as ExchangeInfo)
        .catch((err: BinanceError) => {
          console.error(err);
          throw err;
        })
        .finally(() => setIsLoading(false));
    },
    newOrder: async (order: NewOrderRequest) => {
      setIsLoading(true);
      return await axios
        .post(
          `${apiHost}/transactions/new-order`,
          { order },
          {
            headers: { authorization: `Bearer ${await getIdToken()}` },
          }
        )
        .then((res) => res.data)
        .catch((err) => console.error(err))
        .finally(() => setIsLoading(false));
    },
    get: async (options?: { time?: number }): Promise<Transaction[] | null> => {
      setIsLoading(true);
      return await axios
        .get(`${apiHost}/transactions`, {
          headers: { authorization: `Bearer ${await getIdToken()}` },
          params: {
            time: options?.time,
          },
        })
        .then((res) => res.data)
        .catch((err) => console.error(err))
        .finally(() => setIsLoading(false));
    },
    getById: async (
      symbol: string,
      orderId: string
    ): Promise<BinanceOrderDetails | null> => {
      setIsLoading(true);
      return await axios
        .get(`${apiHost}/transactions/${symbol}/${orderId}`, {
          headers: { authorization: `Bearer ${await getIdToken()}` },
        })
        .then((res) => res.data)
        .catch((err) => console.error(err))
        .finally(() => setIsLoading(false));
    },
  },
  Symbols: {
    extract: async (text: string): Promise<string[]> => {
      setIsLoading(true);
      return await axios
        .post(
          `${apiHost}/symbols/extract`,
          {
            text,
          },
          {
            headers: { authorization: `Bearer ${await getIdToken()}` },
          }
        )
        .then((res) => res.data)
        .catch((err) => console.error(err))
        .finally(() => setIsLoading(false));
    },
    getKlines: async (
      symbol: string,
      interval?: string,
      startTime?: number,
      endTime?: number
    ): Promise<Kline[]> => {
      setIsLoading(true);
      return await axios
        .get(`${apiHost}/symbols/klines/${symbol}`, {
          headers: { authorization: `Bearer ${await getIdToken()}` },
        })
        .then((res) => res.data)
        .catch((err) => console.error(err))
        .finally(() => setIsLoading(false));
    },
    getAverageMove24h: async (
      symbol: string,
      limit?: number
    ): Promise<number> => {
      setIsLoading(true);
      return await axios
        .get(`${apiHost}/symbols/klines/${symbol}/average-move-24h`, {
          headers: { authorization: `Bearer ${await getIdToken()}` },
          params: {
            limit,
          },
        })
        .then((res) => res.data.averageMove24h)
        .catch((err) => console.error(err))
        .finally(() => setIsLoading(false));
    },
  },
  WebSocket: {
    start: async () => {
      setIsLoading(true);
      return await axios
        .post(
          `${apiHost}/websocket/start`,
          {},
          {
            headers: { authorization: `Bearer ${await getIdToken()}` },
          }
        )
        .then(
          (res) =>
            res.data as {
              news: { message: string };
              likes: { message: string };
            }
        )
        .catch((err) => console.log(err))
        .finally(() => setIsLoading(false));
    },
    stop: async () => {
      setIsLoading(true);
      return await axios
        .post(
          `${apiHost}/websocket/stop`,
          {},
          {
            headers: { authorization: `Bearer ${await getIdToken()}` },
          }
        )
        .then(
          (res) =>
            res.data as {
              news: { message: string };
              likes: { message: string };
            }
        )
        .catch((err) => console.log(err))
        .finally(() => setIsLoading(false));
    },
    get: async () => {
      setIsLoading(true);
      return await axios
        .get(`${apiHost}/websocket/info`, {
          headers: { authorization: `Bearer ${await getIdToken()}` },
        })
        .then(
          (res) =>
            res.data as {
              news?: WebSocket;
              likes?: WebSocket;
              newsStartTime?: number;
              likesStartTime?: number;
            }
        )
        .catch((err) => console.error(err))
        .finally(() => setIsLoading(false));
    },
  },
};
