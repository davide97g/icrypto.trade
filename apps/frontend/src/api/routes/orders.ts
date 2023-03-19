import { BinanceError } from "../../models/binance";
import { BinanceOrderDetails, MyTrade } from "../../models/orders";
import { BinanceOrderResponse, NewOrderRequest } from "../../models/trade";
import { setIsLoading } from "../../services/utils";
import { getIdToken } from "../auth";
import { API, apiHost } from "../server";

const routeName = "orders";
export const OrdersRoutes = {
  get: async (symbol: string): Promise<BinanceOrderDetails[] | null> => {
    setIsLoading(true);
    return await API.get(`${apiHost}/${routeName}/${symbol}`, {
      headers: { authorization: `Bearer ${await getIdToken()}` },
    })
      .then((res) => res.data)
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  },
  cancel: async (symbol: string, orderId: string) => {
    setIsLoading(true);
    return await API.delete(`${apiHost}/${routeName}/${symbol}/${orderId}`, {
      headers: { authorization: `Bearer ${await getIdToken()}` },
    })
      .then((res) => res.data as BinanceOrderResponse)
      .catch((err: BinanceError) => {
        console.error(err);
        throw err;
      })
      .finally(() => setIsLoading(false));
  },
  cancelAll: async (symbol: string): Promise<BinanceOrderResponse[] | null> => {
    setIsLoading(true);
    return await API.delete(`${apiHost}/${routeName}/${symbol}/all`, {
      headers: { authorization: `Bearer ${await getIdToken()}` },
    })
      .then((res) => res.data)
      .catch((err: BinanceError) => {
        console.error(err);
        throw err;
      })
      .finally(() => setIsLoading(false));
  },
  sellAll: async (symbol: string): Promise<BinanceOrderResponse | null> => {
    setIsLoading(true);
    return await API.post(
      `${apiHost}/${routeName}/${symbol}/sell-all`,
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
      `${apiHost}/${routeName}/add-symbol`,
      {
        symbol,
        newsId,
      },
      {
        headers: { authorization: `Bearer ${await getIdToken()}` },
      }
    )
      .then((res) => res.data as BinanceOrderResponse)
      .catch((err: BinanceError) => {
        console.error(err);
        throw err;
      })
      .finally(() => setIsLoading(false));
  },
  newOrder: async (order: NewOrderRequest) => {
    setIsLoading(true);
    return await API.post(
      `${apiHost}/${routeName}/${order.symbol}/new`,
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
