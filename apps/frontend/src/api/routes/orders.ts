import { BinanceError } from "../../models/binance";
import { BinanceOrderDetails, MyTrade } from "../../models/orders";
import { BinanceOrder, NewOrderRequest } from "../../models/trade";
import { setIsLoading } from "../../services/utils";
import { getIdToken } from "../auth";
import { API, apiHost } from "../server";

export const OrdersRoutes = {
  get: async (symbol: string): Promise<BinanceOrderDetails[] | null> => {
    setIsLoading(true);
    return await API.get(`${apiHost}/orders/${symbol}`, {
      headers: { authorization: `Bearer ${await getIdToken()}` },
    })
      .then((res) => res.data)
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  },
  getTrades: async (symbol: string): Promise<MyTrade[]> => {
    setIsLoading(true);
    return await API.get(`${apiHost}/orders/${symbol}/trades`, {
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
    return await API.delete(`${apiHost}/orders/${symbol}/${orderId}`, {
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
    return await API.delete(`${apiHost}/orders/${symbol}/all`, {
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
    return await API.post(
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
  addSymbolToNews: async (symbol: string, newsId: string) => {
    setIsLoading(true);
    return await API.post(
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
  newOrder: async (order: NewOrderRequest) => {
    setIsLoading(true);
    return await API.post(
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
};
